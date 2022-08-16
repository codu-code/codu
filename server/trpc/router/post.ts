import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

import { createRouter } from "../createRouter";
import { readingTime } from "../../../utils/readingTime";
import {
  publishPostSchema,
  getSinglePostSchema,
  savePostSchema,
  createPostSchema,
  DeletePostSchema,
} from "../../../schema/post";

export const postRouter = createRouter()
  .mutation("create-post", {
    input: createPostSchema,
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
    input: savePostSchema,
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
          slug: `${title.replace(/\W+/g, "-")}${id}`.toLowerCase(),
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
    input: publishPostSchema,
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

      const post = await ctx.prisma.post.update({
        where: {
          id,
        },
        data: {
          published,
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
    resolve({ ctx }) {
      return ctx.prisma.post.findMany({
        where: {
          published: true,
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
          published: true,
          userId: ctx.session.user.id,
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
          published: false,
          userId: ctx.session.user.id,
        },
      });
    },
  })
  .query("edit-draft", {
    input: getSinglePostSchema,
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
    input: getSinglePostSchema,
    resolve({ ctx, input }) {
      return ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
      });
    },
  });
