import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  CreateDiscussionSchema,
  EditDiscussionSchema,
  DeleteDiscussionSchema,
  GetDiscussionsSchema,
  LikeDiscussionSchema,
  VoteDiscussionSchema,
} from "@/schema/discussion";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "@/utils/notifications";
import {
  discussion,
  discussion_like,
  discussion_vote,
  notification,
  post,
  aggregated_article,
} from "@/server/db/schema";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { increment, decrement } from "./utils";

export const discussionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, targetType, postId, articleId, parentId } = input;
      const userId = ctx.session.user.id;

      // Validate target exists
      if (targetType === "POST" && postId) {
        const postData = await ctx.db.query.post.findFirst({
          where: (posts, { eq }) => eq(posts.id, postId),
        });
        if (!postData) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
      } else if (targetType === "ARTICLE" && articleId) {
        const articleData = await ctx.db.query.aggregated_article.findFirst({
          where: (articles, { eq }) => eq(articles.id, articleId),
        });
        if (!articleData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found",
          });
        }
      }

      const now = new Date().toISOString();

      const [createdDiscussion] = await ctx.db
        .insert(discussion)
        .values({
          userId,
          body,
          targetType,
          postId: targetType === "POST" ? postId : null,
          articleId: targetType === "ARTICLE" ? articleId : null,
          parentId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Send notifications for replies
      if (parentId) {
        const parentDiscussion = await ctx.db.query.discussion.findFirst({
          where: (discussions, { eq }) => eq(discussions.id, parentId),
          columns: { userId: true },
        });

        if (parentDiscussion?.userId && parentDiscussion.userId !== userId) {
          await ctx.db.insert(notification).values({
            notifierId: userId,
            type: NEW_REPLY_TO_YOUR_COMMENT,
            postId: targetType === "POST" ? postId : null,
            userId: parentDiscussion.userId,
          });
        }
      }

      // Send notification for new top-level discussion on posts
      if (!parentId && targetType === "POST" && postId) {
        const postData = await ctx.db.query.post.findFirst({
          where: (posts, { eq }) => eq(posts.id, postId),
          columns: { userId: true },
        });

        if (postData?.userId && postData.userId !== userId) {
          await ctx.db.insert(notification).values({
            notifierId: userId,
            type: NEW_COMMENT_ON_YOUR_POST,
            postId,
            userId: postData.userId,
          });
        }
      }

      return createdDiscussion.id;
    }),

  edit: protectedProcedure
    .input(EditDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, id } = input;

      const currentDiscussion = await ctx.db.query.discussion.findFirst({
        where: (discussions, { eq }) => eq(discussions.id, id),
      });

      if (currentDiscussion?.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (currentDiscussion.body === body) {
        return currentDiscussion;
      }

      const [updatedDiscussion] = await ctx.db
        .update(discussion)
        .set({ body })
        .where(eq(discussion.id, id))
        .returning();

      return updatedDiscussion;
    }),

  delete: protectedProcedure
    .input(DeleteDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentDiscussion = await ctx.db.query.discussion.findFirst({
        where: (discussions, { eq }) => eq(discussions.id, id),
      });

      if (currentDiscussion?.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [deletedDiscussion] = await ctx.db
        .delete(discussion)
        .where(eq(discussion.id, id))
        .returning();

      return deletedDiscussion.id;
    }),

  like: protectedProcedure
    .input(LikeDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { discussionId } = input;
      const userId = ctx.session.user.id;

      const existingLike = await ctx.db.query.discussion_like.findFirst({
        where: (likes, { eq }) =>
          and(eq(likes.userId, userId), eq(likes.discussionId, discussionId)),
      });

      if (existingLike) {
        await ctx.db
          .delete(discussion_like)
          .where(
            and(
              eq(discussion_like.userId, userId),
              eq(discussion_like.discussionId, discussionId),
            ),
          );
        return { liked: false };
      } else {
        await ctx.db.insert(discussion_like).values({
          discussionId,
          userId,
        });
        return { liked: true };
      }
    }),

  // Reddit-style voting (upvote/downvote)
  vote: protectedProcedure
    .input(VoteDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { discussionId, voteType } = input;
      const userId = ctx.session.user.id;

      // Check if discussion exists
      const discussionItem = await ctx.db
        .select({ id: discussion.id, upvotes: discussion.upvotes, downvotes: discussion.downvotes })
        .from(discussion)
        .where(eq(discussion.id, discussionId))
        .limit(1);

      if (discussionItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Discussion not found",
        });
      }

      // Get existing vote
      const existingVote = await ctx.db
        .select({ id: discussion_vote.id, voteType: discussion_vote.voteType })
        .from(discussion_vote)
        .where(
          and(
            eq(discussion_vote.discussionId, discussionId),
            eq(discussion_vote.userId, userId)
          )
        )
        .limit(1);

      if (voteType === null) {
        // Remove vote
        if (existingVote.length > 0) {
          const oldVoteType = existingVote[0].voteType;
          await ctx.db
            .delete(discussion_vote)
            .where(eq(discussion_vote.id, existingVote[0].id));

          // Update vote counts
          if (oldVoteType === "UP") {
            await ctx.db
              .update(discussion)
              .set({ upvotes: decrement(discussion.upvotes) })
              .where(eq(discussion.id, discussionId));
          } else {
            await ctx.db
              .update(discussion)
              .set({ downvotes: decrement(discussion.downvotes) })
              .where(eq(discussion.id, discussionId));
          }
        }
        return { voteType: null };
      } else if (existingVote.length === 0) {
        // New vote
        await ctx.db.insert(discussion_vote).values({
          discussionId,
          userId,
          voteType,
        });

        // Update vote counts
        if (voteType === "UP") {
          await ctx.db
            .update(discussion)
            .set({ upvotes: increment(discussion.upvotes) })
            .where(eq(discussion.id, discussionId));
        } else {
          await ctx.db
            .update(discussion)
            .set({ downvotes: increment(discussion.downvotes) })
            .where(eq(discussion.id, discussionId));
        }
        return { voteType };
      } else if (existingVote[0].voteType !== voteType) {
        // Change vote
        await ctx.db
          .update(discussion_vote)
          .set({ voteType })
          .where(eq(discussion_vote.id, existingVote[0].id));

        // Update vote counts (flip both)
        if (voteType === "UP") {
          await ctx.db
            .update(discussion)
            .set({
              upvotes: increment(discussion.upvotes),
              downvotes: decrement(discussion.downvotes),
            })
            .where(eq(discussion.id, discussionId));
        } else {
          await ctx.db
            .update(discussion)
            .set({
              upvotes: decrement(discussion.upvotes),
              downvotes: increment(discussion.downvotes),
            })
            .where(eq(discussion.id, discussionId));
        }
        return { voteType };
      }

      // Same vote, no change needed
      return { voteType };
    }),

  get: publicProcedure
    .input(GetDiscussionsSchema)
    .query(async ({ ctx, input }) => {
      const { targetType, postId, articleId } = input;
      const userId = ctx?.session?.user?.id;

      // Build where clause based on target type
      const whereClause =
        targetType === "POST" && postId
          ? and(
              eq(discussion.targetType, "POST"),
              eq(discussion.postId, postId),
              isNull(discussion.parentId),
            )
          : targetType === "ARTICLE" && articleId
            ? and(
                eq(discussion.targetType, "ARTICLE"),
                eq(discussion.articleId, articleId),
                isNull(discussion.parentId),
              )
            : undefined;

      if (!whereClause) {
        return { data: [], count: 0 };
      }

      // Get total count
      const [discussionCount] = await db
        .select({ count: count() })
        .from(discussion)
        .where(
          targetType === "POST" && postId
            ? and(
                eq(discussion.targetType, "POST"),
                eq(discussion.postId, postId),
              )
            : and(
                eq(discussion.targetType, "ARTICLE"),
                eq(discussion.articleId, articleId!),
              ),
        );

      const columns = {
        id: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        upvotes: true,
        downvotes: true,
      };

      const userColumns = {
        name: true,
        image: true,
        username: true,
        id: true,
        email: true,
      };

      // Fetch discussions with nested children (6 levels deep like comments)
      const response = await db.query.discussion.findMany({
        columns,
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
                      children: {
                        columns,
                        with: {
                          children: {
                            columns,
                            with: {
                              user: { columns: userColumns },
                              likes: { columns: { userId: true } },
                              votes: { columns: { userId: true, voteType: true } },
                            },
                          },
                          user: { columns: userColumns },
                          likes: { columns: { userId: true } },
                          votes: { columns: { userId: true, voteType: true } },
                        },
                      },
                      user: { columns: userColumns },
                      likes: { columns: { userId: true } },
                      votes: { columns: { userId: true, voteType: true } },
                    },
                  },
                  user: { columns: userColumns },
                  likes: { columns: { userId: true } },
                  votes: { columns: { userId: true, voteType: true } },
                },
              },
              user: { columns: userColumns },
              likes: { columns: { userId: true } },
              votes: { columns: { userId: true, voteType: true } },
            },
          },
          user: { columns: userColumns },
          likes: { columns: { userId: true } },
          votes: { columns: { userId: true, voteType: true } },
        },
        where: whereClause,
        orderBy: [desc(discussion.createdAt)],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function shapeDiscussions(discussionsArr: any[]): any[] {
        return discussionsArr.map((disc) => {
          const { children, likes, votes, upvotes, downvotes, ...rest } = disc;

          // Find the current user's vote
          const userVoteRecord = votes?.find(
            (v: { userId: string; voteType: string }) => v.userId === userId,
          );

          const shaped = {
            // Legacy like support (for backwards compatibility)
            youLikedThis: likes?.some(
              (obj: { userId: string }) => obj.userId === userId,
            ),
            likeCount: likes?.length ?? 0,
            // Reddit-style voting
            userVote: userVoteRecord?.voteType ?? null,
            score: (upvotes ?? 0) - (downvotes ?? 0),
            upvotes: upvotes ?? 0,
            downvotes: downvotes ?? 0,
            ...rest,
          };

          if (children && children.length > 0) {
            return {
              ...shaped,
              children: shapeDiscussions(children),
            };
          }
          return shaped;
        });
      }

      const discussions = shapeDiscussions(response);

      return { data: discussions, count: discussionCount.count };
    }),

  // Get discussion count for an article (useful for feed display)
  getArticleDiscussionCount: publicProcedure
    .input(
      GetDiscussionsSchema.pick({ articleId: true }).extend({
        articleId: GetDiscussionsSchema.shape.articleId.unwrap(),
      }),
    )
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(discussion)
        .where(
          and(
            eq(discussion.targetType, "ARTICLE"),
            eq(discussion.articleId, input.articleId),
          ),
        );

      return result.count;
    }),

  // Get discussion count for unified content (useful for feed display)
  getContentDiscussionCount: publicProcedure
    .input(z.object({ contentId: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(discussion)
        .where(
          and(
            eq(discussion.targetType, "CONTENT"),
            eq(discussion.contentId, input.contentId),
          ),
        );

      return result.count;
    }),
});
