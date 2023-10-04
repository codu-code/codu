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
  GetByIdSchema,
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";
import type { Prisma } from "@prisma/client";

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
      const {
        id,
        body,
        title,
        excerpt,
        canonicalUrl,
        tags = [],
        showComments,
      } = input;

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
          }),
        ),
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

      const post = await ctx.prisma.post.update({
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
          showComments,
        },
      });
      return post;
    }),
  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { published, id } = input;

      const currentPost = await ctx.prisma.post.findUnique({
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

      const post = await ctx.prisma.post.update({
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

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      const isAdmin = ctx.session.user.role === "ADMIN";

      if (!isAdmin && currentPost?.userId !== ctx.session.user.id) {
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
      const userId = ctx.session.user.id;

      if (setLiked) {
        const res = await ctx.prisma.like.create({
          data: {
            postId,
            userId,
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
    .input(GetByIdSchema)
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

    const response = await ctx.prisma.post.findMany({
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
  randomTrending: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    const response = await ctx.prisma.post.findMany({
      where: {
        NOT: {
          published: null,
        },
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
      take: 20,
      orderBy: {
        likes: {
          _count: "desc",
        },
      },
    });

    const cleaned = response.map((post) => {
      let currentUserLikesPost = !!post.bookmarks.length;
      if (userId === undefined) currentUserLikesPost = false;
      post.bookmarks = [];
      return { ...post, currentUserLikesPost };
    });

    const shuffled = cleaned.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    return selected;
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
    .input(GetByIdSchema)
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
  bySlug: publicProcedure
    .input(GetSinglePostSchema)
    .query(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findUnique({
        where: {
          slug: input.slug,
        },
        include: {
          user: {
            select: {
              username: true,
              name: true,
              image: true,
              bio: true,
            },
          },
          tags: {
            select: {
              id: true,
              tag: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return post;
    }),
  myBookmarks: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.prisma.bookmark.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        post: {
          include: { user: true },
        },
      },
    });
    return response.map(({ id, post }) => ({ bookmarkId: id, ...post }));
  }),
});
