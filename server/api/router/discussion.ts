import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  CreateDiscussionSchema,
  EditDiscussionSchema,
  DeleteDiscussionSchema,
  GetDiscussionsSchema,
  VoteDiscussionSchema,
} from "@/schema/discussion";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "@/utils/notifications";
import {
  comments,
  comment_votes,
  notification,
  posts,
  user,
} from "@/server/db/schema";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { increment, decrement } from "./utils";

// Helper to generate ltree path
function generatePath(parentPath: string | null, id: string): string {
  const cleanId = id.replace(/-/g, "");
  if (parentPath) {
    return `${parentPath}.${cleanId}`;
  }
  return cleanId;
}

// Helper to calculate depth from path
function calculateDepth(path: string): number {
  return path.split(".").length - 1;
}

export const discussionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, contentId, parentId } = input;
      const userId = ctx.session.user.id;

      // Validate post exists (using new posts table)
      const postData = await ctx.db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, contentId))
        .limit(1);

      if (postData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get parent comment if replying
      let parentPath: string | null = null;
      let parentAuthorId: string | null = null;

      if (parentId) {
        const parentComment = await ctx.db
          .select({ path: comments.path, authorId: comments.authorId })
          .from(comments)
          .where(eq(comments.id, parentId))
          .limit(1);

        if (parentComment.length > 0) {
          parentPath = parentComment[0].path;
          parentAuthorId = parentComment[0].authorId;
        }
      }

      const now = new Date().toISOString();

      // First insert the comment without the path (we need the generated ID for the path)
      const [createdComment] = await ctx.db
        .insert(comments)
        .values({
          authorId: userId,
          body,
          postId: contentId,
          parentId: parentId || null,
          path: "temp", // Will update after we have the ID
          depth: parentPath ? parentPath.split(".").length : 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Now update with the correct path
      const finalPath = generatePath(parentPath, createdComment.id);
      await ctx.db
        .update(comments)
        .set({ path: finalPath })
        .where(eq(comments.id, createdComment.id));

      // Update post's comment count
      await ctx.db
        .update(posts)
        .set({ commentsCount: increment(posts.commentsCount) })
        .where(eq(posts.id, contentId));

      // Send notifications for replies
      if (parentId && parentAuthorId && parentAuthorId !== userId) {
        await ctx.db.insert(notification).values({
          notifierId: userId,
          type: NEW_REPLY_TO_YOUR_COMMENT,
          userId: parentAuthorId,
        });
      }

      // Send notification for new top-level comment on user's post
      if (!parentId && postData[0].authorId && postData[0].authorId !== userId) {
        await ctx.db.insert(notification).values({
          notifierId: userId,
          type: NEW_COMMENT_ON_YOUR_POST,
          userId: postData[0].authorId,
        });
      }

      return createdComment.id;
    }),

  edit: protectedProcedure
    .input(EditDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, id } = input;

      const currentComment = await ctx.db
        .select({ authorId: comments.authorId, body: comments.body })
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (currentComment.length === 0 || currentComment[0].authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (currentComment[0].body === body) {
        return { id, body };
      }

      const [updatedComment] = await ctx.db
        .update(comments)
        .set({ body, updatedAt: new Date().toISOString() })
        .where(eq(comments.id, id))
        .returning();

      return updatedComment;
    }),

  delete: protectedProcedure
    .input(DeleteDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentComment = await ctx.db
        .select({ authorId: comments.authorId, postId: comments.postId })
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (currentComment.length === 0 || currentComment[0].authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Soft delete: set deletedAt timestamp
      await ctx.db
        .update(comments)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(comments.id, id));

      // Decrement post's comment count
      await ctx.db
        .update(posts)
        .set({ commentsCount: decrement(posts.commentsCount) })
        .where(eq(posts.id, currentComment[0].postId));

      return id;
    }),

  // Reddit-style voting (upvote/downvote)
  vote: protectedProcedure
    .input(VoteDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { discussionId: commentId, voteType } = input;
      const userId = ctx.session.user.id;

      // Check if comment exists
      const commentItem = await ctx.db
        .select({ id: comments.id, upvotesCount: comments.upvotesCount, downvotesCount: comments.downvotesCount })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      if (commentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Get existing vote
      const existingVote = await ctx.db
        .select({ id: comment_votes.id, voteType: comment_votes.voteType })
        .from(comment_votes)
        .where(
          and(
            eq(comment_votes.commentId, commentId),
            eq(comment_votes.userId, userId)
          )
        )
        .limit(1);

      if (voteType === null) {
        // Remove vote
        if (existingVote.length > 0) {
          const oldVoteType = existingVote[0].voteType;
          await ctx.db
            .delete(comment_votes)
            .where(eq(comment_votes.id, existingVote[0].id));

          // Update vote counts
          if (oldVoteType === "up") {
            await ctx.db
              .update(comments)
              .set({ upvotesCount: decrement(comments.upvotesCount) })
              .where(eq(comments.id, commentId));
          } else {
            await ctx.db
              .update(comments)
              .set({ downvotesCount: decrement(comments.downvotesCount) })
              .where(eq(comments.id, commentId));
          }
        }
        return { voteType: null };
      } else if (existingVote.length === 0) {
        // New vote
        await ctx.db.insert(comment_votes).values({
          commentId,
          userId,
          voteType: voteType as "up" | "down",
        });

        // Update vote counts
        if (voteType === "up") {
          await ctx.db
            .update(comments)
            .set({ upvotesCount: increment(comments.upvotesCount) })
            .where(eq(comments.id, commentId));
        } else {
          await ctx.db
            .update(comments)
            .set({ downvotesCount: increment(comments.downvotesCount) })
            .where(eq(comments.id, commentId));
        }
        return { voteType };
      } else if (existingVote[0].voteType !== voteType) {
        // Change vote
        await ctx.db
          .update(comment_votes)
          .set({ voteType: voteType as "up" | "down" })
          .where(eq(comment_votes.id, existingVote[0].id));

        // Update vote counts (flip both)
        if (voteType === "up") {
          await ctx.db
            .update(comments)
            .set({
              upvotesCount: increment(comments.upvotesCount),
              downvotesCount: decrement(comments.downvotesCount),
            })
            .where(eq(comments.id, commentId));
        } else {
          await ctx.db
            .update(comments)
            .set({
              upvotesCount: decrement(comments.upvotesCount),
              downvotesCount: increment(comments.downvotesCount),
            })
            .where(eq(comments.id, commentId));
        }
        return { voteType };
      }

      // Same vote, no change needed
      return { voteType };
    }),

  get: publicProcedure
    .input(GetDiscussionsSchema)
    .query(async ({ ctx, input }) => {
      const { contentId } = input;
      const userId = ctx?.session?.user?.id;

      // Get total count (excluding soft-deleted)
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(
          eq(comments.postId, contentId),
          isNull(comments.deletedAt)
        ));

      // Fetch all comments for this post (flat list, we'll build tree in JS)
      const allComments = await db
        .select({
          id: comments.id,
          body: comments.body,
          parentId: comments.parentId,
          path: comments.path,
          depth: comments.depth,
          upvotesCount: comments.upvotesCount,
          downvotesCount: comments.downvotesCount,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          deletedAt: comments.deletedAt,
          authorId: comments.authorId,
          authorName: user.name,
          authorImage: user.image,
          authorUsername: user.username,
          authorEmail: user.email,
        })
        .from(comments)
        .leftJoin(user, eq(comments.authorId, user.id))
        .where(eq(comments.postId, contentId))
        .orderBy(comments.path); // Order by path for tree structure

      // Get all votes for this user on these comments
      let userVotes: Map<string, string> = new Map();
      if (userId) {
        const votes = await db
          .select({ commentId: comment_votes.commentId, voteType: comment_votes.voteType })
          .from(comment_votes)
          .where(eq(comment_votes.userId, userId));

        userVotes = new Map(votes.map(v => [v.commentId, v.voteType]));
      }

      // Build tree structure
      const commentMap = new Map<string, any>();
      const rootComments: any[] = [];

      // First pass: create all comment objects
      for (const comment of allComments) {
        const shaped = {
          id: comment.id,
          body: comment.deletedAt ? null : comment.body,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          deletedAt: comment.deletedAt,
          upvotes: comment.upvotesCount,
          downvotes: comment.downvotesCount,
          score: comment.upvotesCount - comment.downvotesCount,
          userVote: userVotes.get(comment.id) || null,
          user: comment.deletedAt ? null : {
            id: comment.authorId,
            name: comment.authorName,
            image: comment.authorImage,
            username: comment.authorUsername,
            email: comment.authorEmail,
          },
          children: [],
        };
        commentMap.set(comment.id, shaped);
      }

      // Second pass: build tree
      for (const comment of allComments) {
        const shaped = commentMap.get(comment.id);
        if (comment.parentId && commentMap.has(comment.parentId)) {
          commentMap.get(comment.parentId).children.push(shaped);
        } else if (!comment.parentId) {
          rootComments.push(shaped);
        }
      }

      return { data: rootComments, count: commentCount.count };
    }),

  // Get comment count for content (useful for feed display)
  getContentDiscussionCount: publicProcedure
    .input(z.object({ contentId: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(
          eq(comments.postId, input.contentId),
          isNull(comments.deletedAt)
        ));

      return result.count;
    }),
});
