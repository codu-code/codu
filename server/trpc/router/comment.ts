import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  CreateCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
} from "../../../schema/comment";

export const commentRouter = router({
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, postId, parentId } = input;
      const comment = await ctx.prisma.comment.create({
        data: {
          userId: ctx.session.user.id,
          body,
          postId,
          parentId,
        },
      });
      return comment;
    }),
  delete: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentComment = await ctx.prisma.comment.findUnique({
        where: { id },
      });

      if (currentComment?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const comment = await ctx.prisma.comment.delete({
        where: {
          id,
        },
      });

      return comment.id;
    }),
  get: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      interface ChildConfig {
        select: {
          id: boolean;
          body: boolean;
          createdAt: boolean;
          user: {
            select: { name: boolean; image: boolean; username: boolean };
          };
          children?: ChildConfig;
        };
      }

      const { postId } = input;

      const selectNChildrenConfig = (n: number): ChildConfig => {
        if (n === 0) {
          return {
            select: {
              id: true,
              body: true,
              createdAt: true,
              user: {
                select: { name: true, image: true, username: true },
              },
            },
          };
        }
        return {
          select: {
            id: true,
            body: true,
            createdAt: true,
            user: {
              select: { name: true, image: true, username: true },
            },
            children: selectNChildrenConfig(n - 1),
          },
        };
      };

      const count: number = await ctx.prisma.comment.count({
        where: { postId },
      });
      const response = await ctx.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        select: {
          id: true,
          body: true,
          createdAt: true,
          user: {
            select: { name: true, image: true, username: true },
          },
          children: {
            ...selectNChildrenConfig(6),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return { data: response, count };
    }),
});
