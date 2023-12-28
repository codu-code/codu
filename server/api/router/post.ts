import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { readingTime } from "../../../utils/readingTime";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  PublishPostSchema,
  GetSinglePostSchema,
  SavePostSchema,
  CreatePostSchema,
  DeletePostSchema,
  GetPostsSchema,
  LikePostSchema,
  BookmarkPostSchema,
  GetByIdSchema,
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";
import type { Prisma } from "@prisma/client";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { body } = input;
      const id = nanoid(8);
      const post = await ctx.db.post.create({
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
      const { id, body, title, excerpt, canonicalUrl, tags = [] } = input;

      const currentPost = await ctx.db.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const tagResponse = await Promise.all(
        tags.map((tag) =>
          ctx.db.tag.upsert({
            where: {
              title: tag,
            },
            update: {},
            create: { title: tag },
          }),
        ),
      );

      await ctx.db.postTag.deleteMany({
        where: {
          postId: id,
        },
      });

      await Promise.all(
        tagResponse.map((tag) =>
          ctx.db.postTag.create({
            data: {
              tagId: tag.id,
              postId: id,
            },
          }),
        ),
      );

      const getExcerptValue = (): string | undefined => {
        if (currentPost.published) {
          return excerpt && excerpt.length > 0
            ? excerpt
            : removeMarkdown(currentPost.body, {}).substring(0, 156);
        }
        return excerpt;
      };

      const post = await ctx.db.post.update({
        where: {
          id,
        },
        data: {
          id,
          body,
          title,
          excerpt: getExcerptValue() || "",
          readTimeMins: readingTime(body),
          canonicalUrl,
        },
      });
      return post;
    }),
  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { published, id } = input;

      const currentPost = await ctx.db.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const { excerpt, title } = currentPost;

      const publishedValue = published ? new Date().toISOString() : null;

      const excerptOrCreatedExcerpt: string =
        excerpt.length > 0
          ? excerpt
          : removeMarkdown(currentPost.body, {}).substring(0, 156);

      const post = await ctx.db.post.update({
        where: {
          id,
        },
        data: {
          slug: `${title.replace(/\W+/g, "-")}-${id}`
            .toLowerCase()
            .replace(/^-+|-+(?=-|$)/g, ""),
          published: publishedValue,
          excerpt: excerptOrCreatedExcerpt,
        },
      });
      return post;
    }),
  delete: protectedProcedure
    .input(DeletePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentPost = await ctx.db.post.findUnique({
        where: { id },
      });

      const isAdmin = ctx.session.user.role === "ADMIN";

      if (!isAdmin && currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const post = await ctx.db.post.delete({
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
      const userId = ctx.session.user.id;

      if (setLiked) {
        const res = await ctx.db.like.create({
          data: {
            postId,
            userId,
          },
        });
        return res;
      }
      const res = await ctx.db.like.deleteMany({
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
        const res = await ctx.db.bookmark.create({
          data: {
            postId,
            userId: ctx.session?.user?.id,
          },
        });
        return res;
      }
      const res = await ctx.db.bookmark.deleteMany({
        where: {
          AND: [{ postId }, { userId: ctx.session?.user?.id }],
        },
      });
      return res;
    }),
  sidebarData: publicProcedure
    .input(GetByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const [likes, currentUserLikedCount, currentUserBookmarkedCount] =
        await Promise.all([
          ctx.db.like.count({
            where: {
              postId: id,
            },
          }),
          ctx.db.like.count({
            where: {
              postId: id,
              userId: ctx.session?.user?.id,
            },
          }),
          ctx.db.bookmark.count({
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
  all: publicProcedure.input(GetPostsSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const limit = input?.limit ?? 50;
    const { cursor, sort, tag, searchTerm } = input;

    const orderMapping = {
      newest: {
        published: "desc" as Prisma.SortOrder,
      },
      oldest: {
        published: "asc" as Prisma.SortOrder,
      },
      top: {
        likes: {
          _count: "desc" as Prisma.SortOrder,
        },
      },
    };
    const orderBy = orderMapping[sort] || orderMapping["newest"];

    const response = await ctx.db.post.findMany({
      take: limit + 1,
      where: {
        NOT: {
          published: null,
        },
        ...(tag
          ? {
              tags: {
                some: {
                  tag: {
                    title: {
                      contains: tag?.toUpperCase() || "",
                    },
                  },
                },
              },
            }
          : {}),
        ...(searchTerm
          ? {
              OR: [
                {
                  user: {
                    name: {
                      contains: searchTerm || "",
                      mode: "insensitive",
                    },
                  },
                },
                {
                  title: {
                    contains: searchTerm || "",
                    mode: "insensitive",
                  },
                },
                {
                  excerpt: {
                    contains: searchTerm || "",
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        readTimeMins: true,
        slug: true,
        excerpt: true,
        user: {
          select: { name: true, image: true, username: true },
        },
        bookmarks: {
          select: { userId: true },
          where: { userId: userId },
        },
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy,
    });

    const cleaned = response.map((post) => {
      let currentUserLikesPost = !!post.bookmarks.length;
      if (userId === undefined) currentUserLikesPost = false;
      post.bookmarks = [];
      return { ...post, currentUserLikesPost };
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (response.length > limit) {
      const nextItem = response.pop();
      nextCursor = nextItem?.id;
    }

    return { posts: cleaned, nextCursor };
  }),
  myPosts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.post.findMany({
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
    return ctx.db.post.findMany({
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
    .input(GetByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const currentPost = await ctx.db.post.findUnique({
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
  myBookmarks: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.db.bookmark.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        post: {
          include: { user: true },
        },
      },
      orderBy: {
        id: "desc",
      },
    });
    return response.map(({ id, post }) => ({ bookmarkId: id, ...post }));
  }),
});
