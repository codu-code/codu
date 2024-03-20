import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  SaveCommentSchema,
  EditCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
  LikeCommentSchema,
} from "../../../schema/comment";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "../../../utils/notifications";
import { comment, notification } from "@/server/db/schema";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(SaveCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, postId, parentId } = input;
      const userId = ctx.session.user.id;

      const postData = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, postId),
      });

      const postOwnerId = postData?.userId;

      const [createdComment] = await ctx.db
        .insert(comment)
        .values({
          userId,
          postId,
          body,
          parentId,
          updatedAt: new Date(),
        })
        .returning();

      if (parentId) {
        const commentData = await ctx.db.query.comment.findFirst({
          where: (posts, { eq }) => eq(posts.id, parentId),
          columns: { userId: true },
        });

        if (commentData?.userId && commentData?.userId !== userId) {
          await ctx.db.insert(notification).values({
            notifierId: userId,
            type: NEW_REPLY_TO_YOUR_COMMENT,
            postId,
            userId: commentData.userId,
            commentId: createdComment.id,
            updatedAt: new Date(),
          });
        }
      }

      if (!parentId && postOwnerId && postOwnerId !== userId) {
        await ctx.db.insert(notification).values({
          notifierId: userId,
          type: NEW_COMMENT_ON_YOUR_POST,
          postId,
          userId: postOwnerId,
          commentId: createdComment.id,
          updatedAt: new Date(),
        });
      }

      return createdComment.id;
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
          select: {
            name: true,
            image: true,
            username: true,
            id: true,
            email: true,
          },
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
          email: string | null;
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
