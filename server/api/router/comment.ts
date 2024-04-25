import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  SaveCommentSchema,
  EditCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
  LikeCommentSchema,
} from "@/schema/comment";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "@/utils/notifications";
import { comment, notification, like } from "@/server/db/schema";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";

export const commentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(SaveCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, postId, parentId } = input;
      const userId = ctx.session.user.id;

      const postData = await ctx.db.query.post.findFirst({
        columns: { userId: true },
        where: (posts, { eq }) => eq(posts.id, postId),
      });

      const postOwnerId = postData?.userId;
      const now = new Date().toISOString();

      const [createdComment] = await ctx.db
        .insert(comment)
        .values({
          userId,
          postId,
          body,
          parentId,
          createdAt: now,
          updatedAt: now,
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
        });
      }

      return createdComment.id;
    }),
  edit: protectedProcedure
    .input(EditCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, id } = input;

      const currentComment = await ctx.db.query.comment.findFirst({
        where: (comments, { eq }) => eq(comments.id, id),
      });

      if (currentComment?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      if (currentComment.body === body) {
        return currentComment;
      }

      const updatedComment = await ctx.db
        .update(comment)
        .set({
          body,
        })
        .where(eq(comment.id, id));

      return updatedComment;
    }),
  delete: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentComment = await ctx.db.query.comment.findFirst({
        where: (comments, { eq }) => eq(comments.id, id),
      });

      if (currentComment?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const [deletedComment] = await ctx.db
        .delete(comment)
        .where(eq(comment.id, id))
        .returning();

      return deletedComment.id;
    }),
  like: protectedProcedure
    .input(LikeCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { commentId } = input;
      const userId = ctx.session.user.id;

      const commentLiked = await ctx.db.query.like.findFirst({
        where: (likes, { eq }) =>
          and(eq(likes.userId, userId), eq(likes.commentId, commentId)),
      });

      const [res] = commentLiked
        ? await ctx.db
            .delete(like)
            .where(and(eq(like.userId, userId), eq(like.commentId, commentId)))
            .returning()
        : await ctx.db
            .insert(like)
            .values({
              commentId,
              userId,
            })
            .returning();

      return res;
    }),
  get: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { postId } = input;
      const userId = ctx?.session?.user?.id;

      const [commentCount] = await db
        .select({ count: count() })
        .from(comment)
        .where(eq(comment.postId, postId));

      // @TODO fix type inference so we can use these everywhere
      const columns = {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      };

      const userColumns = {
        name: true,
        image: true,
        username: true,
        id: true,
        email: true,
      };

      const response = await db.query.comment.findMany({
        columns: { id: true, body: true, createdAt: true, updatedAt: true },

        with: {
          children: {
            columns: {
              id: true,
              body: true,
              createdAt: true,
              updatedAt: true,
            },
            with: {
              children: {
                columns: {
                  id: true,
                  body: true,
                  createdAt: true,
                  updatedAt: true,
                },
                with: {
                  children: {
                    columns,
                    with: {
                      children: {
                        columns,
                        with: {
                          children: {
                            columns,
                            with: {
                              user: {
                                columns: userColumns,
                              },
                              likes: {
                                columns: { userId: true },
                              },
                            },
                          },
                          user: {
                            columns: {
                              name: true,
                              image: true,
                              username: true,
                              id: true,
                              email: true,
                            },
                          },
                          likes: {
                            columns: { userId: true },
                          },
                        },
                      },
                      user: {
                        columns: userColumns,
                      },
                      likes: {
                        columns: { userId: true },
                      },
                    },
                  },
                  user: {
                    columns: userColumns,
                  },
                  likes: {
                    columns: { userId: true },
                  },
                },
              },
              user: {
                columns: {
                  name: true,
                  image: true,
                  username: true,
                  id: true,
                  email: true,
                },
              },
              likes: {
                columns: { userId: true, postId: true },
              },
            },
          },
          user: {
            columns: {
              name: true,
              image: true,
              username: true,
              id: true,
              email: true,
            },
          },
          likes: {
            columns: { userId: true },
          },
        },
        where: and(eq(comment.postId, postId), isNull(comment.parentId)),
        orderBy: [desc(comment.createdAt)],
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
        createdAt: string;
        updatedAt: string;
        children?: ShapedResponse[];
      }
      [];

      function shapeComments(commentsArr: typeof response): ShapedResponse[] {
        const value = commentsArr.map((comment) => {
          const { children, likes, ...rest } = comment;

          const shaped = {
            youLikedThis: likes.some((obj) => obj.userId === userId),
            likeCount: likes.length,
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

      return { data: comments, count: commentCount.count };
    }),
});
