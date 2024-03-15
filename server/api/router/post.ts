import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { readingTime } from "../../../utils/readingTime";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  PublishPostSchema,
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
import { post, post_tag, tag } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { body } = input;
      const id = nanoid(8);
      const [newPost] = await ctx.db
        .insert(post)
        .values({
          ...input,
          id,
          readTimeMins: readingTime(body),
          slug: id,
          userId: ctx.session.user.id,
          updatedAt: new Date(),
        })
        .returning();

      return newPost;
    }),
  update: protectedProcedure
    .input(SavePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, body, title, excerpt, canonicalUrl, tags = [] } = input;

      const currentPost = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const existingTags = await Promise.all(
        tags.map((tagTitle) =>
          ctx.db.select().from(tag).where(eq(tag.title, tagTitle)),
        ),
      );
      // only returns newly added tags
      const tagResponse = await Promise.all(
        tags.map((tagTitle) =>
          ctx.db
            .insert(tag)
            .values({ title: tagTitle })
            .onConflictDoNothing({
              target: [tag.title],
            })
            .returning(),
        ),
      );

      //If you think you hate this.. I hate it more
      // drizzle is giving back an empty array when it hits a conflict
      // drizzle is giving back an empty array when it cant find a row
      const tagsToLinkToPost = [
        ...tagResponse.filter((res) => res.length),
        ...existingTags.filter((res) => res.length),
      ];

      console.log("tagsToLinkToPost", tagsToLinkToPost);

      await ctx.db.delete(post_tag).where(eq(post_tag.postId, id));
      await Promise.all(
        tagsToLinkToPost.map(([tag]) =>
          ctx.db.insert(post_tag).values({
            tagId: tag.id,
            postId: id,
          }),
        ),
      );

      const getExcerptValue = (): string | undefined => {
        if (currentPost.published) {
          return excerpt && excerpt.length > 0
            ? excerpt
            : // @Todo why is body string | null ?
              removeMarkdown(currentPost.body as string, {}).substring(0, 156);
        }
        return excerpt;
      };

      // const post = await ctx.prisma.post.update({
      //   where: {
      //     id,
      //   },
      //   data: {
      //     id,
      //     body,
      //     title,
      //     excerpt: getExcerptValue() || "",
      //     readTimeMins: readingTime(body),
      //     canonicalUrl: !!canonicalUrl ? canonicalUrl : null,
      //   },
      // });

      const postResponse = await ctx.db
        .update(post)
        .set({
          id,
          body,
          title,
          excerpt: getExcerptValue() || "",
          readTimeMins: readingTime(body),
          canonicalUrl: !!canonicalUrl ? canonicalUrl : null,
        })
        .where(eq(post.id, id));

      return postResponse;
    }),
  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { published, id, publishTime } = input;

      const getPublishedTime = () => {
        if (!published) {
          return null;
        }
        if (publishTime) {
          return publishTime.toISOString();
        }
        return new Date().toISOString();
      };

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const { excerpt, title } = currentPost;

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
          published: getPublishedTime(),
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
  published: publicProcedure
    .input(GetPostsSchema)
    .query(async ({ ctx, input }) => {
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
          published: {
            lte: new Date(),
            not: null,
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
          published: true,
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
  myPublished: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        NOT: [{ published: null }],
        published: {
          lte: new Date(),
        },
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
  myScheduled: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.post.findMany({
      where: {
        NOT: [{ published: null }],
        published: {
          gt: new Date(),
        },
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
        published: "asc",
      },
    });
  }),
  myDrafts: protectedProcedure.query(async ({ ctx }) => {
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
      orderBy: {
        id: "desc",
      },
    });
    return response.map(({ id, post }) => ({ bookmarkId: id, ...post }));
  }),
});
