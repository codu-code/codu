import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import {
  SaveCommentSchema,
  EditCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
  LikeCommentSchema,
} from "../../../schema/comment";

export const commentRouter = router({
  create: protectedProcedure
    .input(SaveCommentSchema)
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
  edit: protectedProcedure
    .input(EditCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, id } = input;
      const currentComment = await ctx.prisma.comment.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (currentComment?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      if (currentComment.body === body) {
        return currentComment;
      }

      const comment = await ctx.prisma.comment.update({
        where: {
          id,
        },
        data: {
          body,
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
  like: protectedProcedure
    .input(LikeCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input;
      const userId = ctx.session.user.id;

      const liked = await ctx.prisma.like.findUnique({
        where: {
          userId_commentId: { userId, commentId },
        },
      });

      if (liked) {
        const res = await ctx.prisma.like.delete({
          where: {
            userId_commentId: { userId, commentId },
          },
        });

        return res;
      }

      const res = await ctx.prisma.like.create({
        data: {
          commentId,
          userId,
        },
      });

      return res;
    }),
  get: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx?.session?.user?.id;

      const SELECT_CHILD_CONFIG = {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            likes: true,
          },
        },
        user: {
          select: { name: true, image: true, username: true, id: true },
        },
        likes: {
          where: {
            ...(userId ? { userId } : {}),
          },
          select: {
            userId: true,
          },
        },
      };

      const count = await ctx.prisma.comment.count({
        where: {
          postId,
        },
      });

      const response = await ctx.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        // Ugly as hell but this grabs comments up to 6 levels deep
        select: {
          ...SELECT_CHILD_CONFIG,
          children: {
            select: {
              ...SELECT_CHILD_CONFIG,
              children: {
                select: {
                  ...SELECT_CHILD_CONFIG,
                  children: {
                    select: {
                      ...SELECT_CHILD_CONFIG,
                      children: {
                        select: {
                          ...SELECT_CHILD_CONFIG,
                          children: {
                            select: {
                              ...SELECT_CHILD_CONFIG,
                              children: {
                                select: { ...SELECT_CHILD_CONFIG },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      interface ShapedResponse {
        user: {
          id: string;
          username: string | null;
          name: string;
          image: string;
        };
        youLikedThis: boolean;
        likeCount: number;
        id: number;
        body: string;
        createdAt: Date;
        updatedAt: Date;
        children?: ShapedResponse[];
      }
      [];

      function shapeComments(commentsArr: typeof response): ShapedResponse[] {
        const value = commentsArr.map((comment) => {
          const {
            children,
            likes: youLikeThis,
            _count: likeCount,
            ...rest
          } = comment;

          const shaped = {
            youLikedThis: youLikeThis.some((obj) => obj.userId === userId),
            likeCount: likeCount.likes,
            ...rest,
          };
          if (children) {
            return {
              ...shaped,
              children: shapeComments(children),
            };
          }
          return shaped;
        });
        return value;
      }

      const comments = shapeComments(response);

      return { data: comments, count };
    }),
});
