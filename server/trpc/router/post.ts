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
  ConfirmPostSchema,
} from "../../../schema/post";

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

      const { id, body, title } = input;

      const currentPost = await ctx.prisma.post.findUnique({
        where: { id },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const post = await ctx.prisma.post.update({
        where: {
          id,
        },
        data: {
          ...input,
          readTimeMins: readingTime(body),
          slug: `${title.replace(/\W+/g, "-")}-${id}`.toLowerCase(),
          excerpt:
            body.length < 140
              ? body
              : body.replace(/\s+/g, " ").trim().slice(0, 137) + "...",
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

      const parsedPost = ConfirmPostSchema.parse(currentPost);

      console.log({ parsedPost });

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
