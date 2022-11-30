import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { readingTime } from "../../../utils/readingTime";
import { router, publicProcedure, protectedProcedure } from "../trpc";

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

export const postRouter = router({
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
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
    }),
  update: protectedProcedure
    .input(SavePostSchema)
    .mutation(async ({ input, ctx }) => {
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

      const post = await ctx.prisma.post.update({
        where: {
          id,
        },
        data: {
          id,
          body,
          title,
          excerpt,
          readTimeMins: readingTime(body),
          slug: `${title.replace(/\W+/g, "-")}-${id}`.toLowerCase(),
          ...(canonicalUrl ? { canonicalUrl } : {}),
        },
      });
      return post;
    }),
  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { published, id, excerpt } = input;

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
          excerpt,
        },
      });
      return post;
    }),
  delete: protectedProcedure
    .input(DeletePostSchema)
    .mutation(async ({ input, ctx }) => {
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
    }),
  like: protectedProcedure
    .input(LikePostSchema)
    .mutation(async ({ input, ctx }) => {
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
    }),
  bookmark: protectedProcedure
    .input(BookmarkPostSchema)
    .mutation(async ({ input, ctx }) => {
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
    }),
  sidebarData: publicProcedure
    .input(GetSinglePostSchema)
    .query(async ({ input, ctx }) => {
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
    }),
  all: publicProcedure.input(GetPostsSchema).query(async ({ input, ctx }) => {
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
  }),
  myPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        NOT: [{ published: null }],
        userId: ctx?.session?.user?.id,
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
  }),
  drafts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        published: null,
        userId: ctx.session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),
  editDraft: protectedProcedure
    .input(GetSinglePostSchema)
    .query(async ({ input, ctx }) => {
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
    }),
  getById: publicProcedure
    .input(GetSinglePostSchema)
    .query(async ({ input, ctx }) => {
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
    }),
});
