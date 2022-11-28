import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import { createRouter } from "../createRouter";
import { readingTime } from "../../../utils/readingTime";
import {
  PublishPostSchema,
  GetSinglePostSchema,
  SavePostSchema,
  CreatePostSchema,
  DeletePostSchema,
  GetPostsSchema,
  LikePostSchema,
  BookmarkPostSchema,
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";

export const postRouter = createRouter()
  .mutation("create", {
    input: CreatePostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { body } = input;
      const id = nanoid(8);
      const post = await ctx.prisma.post.create({
        data: {
          ...input,
          id,
          readTimeMins: readingTime(body),
          slug: id,
          userId: ctx.session.user.id,
        },
      });
      return post;
    },
  })
  .mutation("update", {
    input: SavePostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { id, body, title, excerpt = "", canonicalUrl, tags = [] } = input;

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const tagResponse = await Promise.all(
        tags.map((tag) =>
          ctx.prisma.tag.upsert({
            where: {
              title: tag,
            },
            update: {},
            create: { title: tag },
          })
        )
      );

      await ctx.prisma.postTag.deleteMany({
        where: {
          postId: id,
        },
      });

      await Promise.all(
        tagResponse.map((tag) =>
          ctx.prisma.postTag.create({
            data: {
              tagId: tag.id,
              postId: id,
            },
          })
        )
      );

      const excerptOrCreatedExcerpt =
        excerpt.length > 0
          ? excerpt
          : removeMarkdown(currentPost.body, {}).substring(0, 156);

      const post = await ctx.prisma.post.update({
        where: {
          id,
        },
        data: {
          id,
          body,
          title,
          excerpt: excerptOrCreatedExcerpt,
          readTimeMins: readingTime(body),
          slug: `${title.replace(/\W+/g, "-")}-${id}`.toLowerCase(),
          ...(canonicalUrl ? { canonicalUrl } : {}),
        },
      });
      return post;
    },
  })
  .mutation("publish", {
    input: PublishPostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { published, id } = input;

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const publishedValue = published ? new Date().toISOString() : null;

      const post = await ctx.prisma.post.update({
        where: {
          id,
        },
        data: {
          published: publishedValue,
        },
      });
      return post;
    },
  })
  .mutation("delete", {
    input: DeletePostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { id } = input;

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const post = await ctx.prisma.post.delete({
        where: {
          id,
        },
      });
      return post;
    },
  })
  .mutation("like", {
    input: LikePostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { postId, setLiked } = input;

      if (setLiked) {
        const res = await ctx.prisma.like.create({
          data: {
            postId,
            userId: ctx.session?.user?.id,
          },
        });
        return res;
      }
      const res = await ctx.prisma.like.deleteMany({
        where: {
          AND: [{ postId }, { userId: ctx.session?.user?.id }],
        },
      });
      return res;
    },
  })
  .mutation("bookmark", {
    input: BookmarkPostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { postId, setBookmarked } = input;

      if (setBookmarked) {
        const res = await ctx.prisma.bookmark.create({
          data: {
            postId,
            userId: ctx.session?.user?.id,
          },
        });
        return res;
      }
      const res = await ctx.prisma.bookmark.deleteMany({
        where: {
          AND: [{ postId }, { userId: ctx.session?.user?.id }],
        },
      });
      return res;
    },
  })
  .query("sidebarData", {
    input: GetSinglePostSchema,
    async resolve({ ctx, input }) {
      const { id } = input;

      const [likes, currentUserLikedCount, currentUserBookmarkedCount] =
        await Promise.all([
          ctx.prisma.like.count({
            where: {
              postId: id,
            },
          }),
          ctx.prisma.like.count({
            where: {
              postId: id,
              userId: ctx.session?.user?.id,
            },
          }),
          ctx.prisma.bookmark.count({
            where: {
              postId: id,
              userId: ctx.session?.user?.id,
            },
          }),
        ]);

      return {
        likes,
        currentUserLiked: !!ctx.session?.user?.id && !!currentUserLikedCount,
        currentUserBookmarked:
          !!ctx.session?.user?.id && !!currentUserBookmarkedCount,
      };
    },
  })
  .query("all", {
    input: GetPostsSchema,
    resolve({ ctx, input }) {
      return ctx.prisma.post.findMany({
        where: {
          NOT: [{ published: null }],
          ...input,
        },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          published: "desc",
        },
      });
    },
  })
  .query("myPosts", {
    resolve({ ctx }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      return ctx.prisma.post.findMany({
        where: {
          NOT: [{ published: null }],
          userId: ctx.session.user.id,
        },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          published: "desc",
        },
      });
    },
  })
  .query("drafts", {
    resolve({ ctx }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      return ctx.prisma.post.findMany({
        where: {
          published: null,
          userId: ctx.session.user.id,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    },
  })
  .query("editDraft", {
    input: GetSinglePostSchema,
    async resolve({ ctx, input }) {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authenticated",
        });
      }

      const { id } = input;

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
        include: {
          tags: {
            select: {
              tag: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      return currentPost;
    },
  })
  .query("getById", {
    input: GetSinglePostSchema,
    resolve({ ctx, input }) {
      return ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });
    },
  });
