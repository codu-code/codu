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
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";

export const postRouter = createRouter()
  .mutation("create-post", {
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
  .mutation("save-post", {
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
  .mutation("publish-post", {
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
  .mutation("delete-post", {
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
  .query("posts", {
    input: GetPostsSchema,
    resolve({ ctx, input }) {
      return ctx.prisma.post.findMany({
        where: {
          NOT: [{ published: null }],
          ...input,
        },
        orderBy: {
          published: "desc",
        },
      });
    },
  })
  .query("my-posts", {
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
  .query("edit-draft", {
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
  .query("single-post", {
    input: GetSinglePostSchema,
    resolve({ ctx, input }) {
      return ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
      });
    },
  });
