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
  NEW_COMMENT_ON_FOLLOWED_POST,
} from "@/utils/notifications";
import {
  comments,
  comment_votes,
  notification,
  posts,
  post_follow,
  post_votes,
  bookmarks,
  user,
} from "@/server/db/schema";
import { and, count, desc, eq, isNull, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { decrement } from "./utils";
import * as Sentry from "@sentry/nextjs";

/**
 * Notify everyone following `postId` of a new comment, except people who are
 * already covered by another notification for this comment (the post author and
 * the replied-to comment's author) and the commenter themselves. Never throws.
 */
async function notifyPostFollowers({
  postId,
  commentId,
  commenterId,
  excludeUserIds,
}: {
  postId: string;
  commentId: string;
  commenterId: string;
  excludeUserIds: (string | null | undefined)[];
}) {
  try {
    const exclude = new Set(
      [commenterId, ...excludeUserIds].filter(Boolean) as string[],
    );

    const followers = await db
      .select({ userId: post_follow.userId })
      .from(post_follow)
      .where(eq(post_follow.postId, postId));

    const recipients = followers
      .map((f) => f.userId)
      .filter((uid) => !exclude.has(uid));

    if (recipients.length === 0) return;

    await db.insert(notification).values(
      recipients.map((uid) => ({
        notifierId: commenterId,
        type: NEW_COMMENT_ON_FOLLOWED_POST,
        userId: uid,
        postId,
        commentId,
      })),
    );
  } catch (error) {
    Sentry.captureException(error);
  }
}

function generatePath(parentPath: string | null, id: string): string {
  const cleanId = id.replace(/-/g, "");
  if (parentPath) {
    return `${parentPath}.${cleanId}`;
  }
  return cleanId;
}

export const discussionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, contentId, parentId } = input;
      const userId = ctx.session.user.id;

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

      // Insert without path first; the path needs the generated comment ID.
      const [createdComment] = await ctx.db
        .insert(comments)
        .values({
          authorId: userId,
          body,
          postId: contentId,
          parentId: parentId || null,
          path: "temp",
          depth: parentPath ? parentPath.split(".").length : 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Pin updatedAt to createdAt so the path write (which trips updatedAt's $onUpdate) doesn't make a brand-new comment render as "edited".
      const finalPath = generatePath(parentPath, createdComment.id);
      await ctx.db
        .update(comments)
        .set({ path: finalPath, updatedAt: createdComment.createdAt })
        .where(eq(comments.id, createdComment.id));

      // Comment count is updated via trigger (tr_post_comments_count) on INSERT.

      if (parentId && parentAuthorId && parentAuthorId !== userId) {
        await ctx.db.insert(notification).values({
          notifierId: userId,
          type: NEW_REPLY_TO_YOUR_COMMENT,
          userId: parentAuthorId,
          postId: contentId,
          commentId: createdComment.id,
        });
      }

      if (
        !parentId &&
        postData[0].authorId &&
        postData[0].authorId !== userId
      ) {
        await ctx.db.insert(notification).values({
          notifierId: userId,
          type: NEW_COMMENT_ON_YOUR_POST,
          userId: postData[0].authorId,
          postId: contentId,
          commentId: createdComment.id,
        });
      }

      await notifyPostFollowers({
        postId: contentId,
        commentId: createdComment.id,
        commenterId: userId,
        excludeUserIds: [postData[0].authorId, parentAuthorId],
      });

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

      if (
        currentComment.length === 0 ||
        currentComment[0].authorId !== ctx.session.user.id
      ) {
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

      if (
        currentComment.length === 0 ||
        currentComment[0].authorId !== ctx.session.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(comments)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(comments.id, id));

      // Manual decrement needed because soft delete (UPDATE) doesn't trigger tr_post_comments_count
      await ctx.db
        .update(posts)
        .set({ commentsCount: decrement(posts.commentsCount) })
        .where(eq(posts.id, currentComment[0].postId));

      return id;
    }),

  vote: protectedProcedure
    .input(VoteDiscussionSchema)
    .mutation(async ({ input, ctx }) => {
      const { discussionId: commentId, voteType } = input;
      const userId = ctx.session.user.id;

      const commentItem = await ctx.db
        .select({
          id: comments.id,
          upvotesCount: comments.upvotesCount,
          downvotesCount: comments.downvotesCount,
        })
        .from(comments)
        .where(eq(comments.id, commentId))
        .limit(1);

      if (commentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      const existingVote = await ctx.db
        .select({ id: comment_votes.id, voteType: comment_votes.voteType })
        .from(comment_votes)
        .where(
          and(
            eq(comment_votes.commentId, commentId),
            eq(comment_votes.userId, userId),
          ),
        )
        .limit(1);

      // Vote counts are kept in sync by trigger (tr_comment_vote_counts).
      if (voteType === null) {
        if (existingVote.length > 0) {
          await ctx.db
            .delete(comment_votes)
            .where(eq(comment_votes.id, existingVote[0].id));
        }
        return { voteType: null };
      } else if (existingVote.length === 0) {
        await ctx.db.insert(comment_votes).values({
          commentId,
          userId,
          voteType: voteType as "up" | "down",
        });
        return { voteType };
      } else if (existingVote[0].voteType !== voteType) {
        await ctx.db
          .update(comment_votes)
          .set({ voteType: voteType as "up" | "down" })
          .where(eq(comment_votes.id, existingVote[0].id));
        return { voteType };
      }

      return { voteType };
    }),

  get: publicProcedure
    .input(GetDiscussionsSchema)
    .query(async ({ ctx, input }) => {
      const { contentId } = input;
      const userId = ctx?.session?.user?.id;

      // Total count excludes soft-deleted.
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(eq(comments.postId, contentId), isNull(comments.deletedAt)));

      // Fetch flat; the tree is built in JS below.
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

      // Scope the user-vote lookup to this post's comments, not every vote the user has ever cast.
      let userVotes: Map<string, string> = new Map();
      const commentIds = allComments.map((c) => c.id);
      if (userId && commentIds.length > 0) {
        const votes = await db
          .select({
            commentId: comment_votes.commentId,
            voteType: comment_votes.voteType,
          })
          .from(comment_votes)
          .where(
            and(
              eq(comment_votes.userId, userId),
              inArray(comment_votes.commentId, commentIds),
            ),
          );

        userVotes = new Map(votes.map((v) => [v.commentId, v.voteType]));
      }

      const commentMap = new Map<string, any>();
      const rootComments: any[] = [];

      // First pass: create all comment objects.
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
          user: comment.deletedAt
            ? null
            : {
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

  getContentDiscussionCount: publicProcedure
    .input(z.object({ contentId: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(comments)
        .where(
          and(eq(comments.postId, input.contentId), isNull(comments.deletedAt)),
        );

      return result.count;
    }),

  // Follow a discussion to be notified of new comments. Idempotent.
  follow: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(post_follow)
        .values({ userId: ctx.session.user.id, postId: input.postId })
        .onConflictDoNothing();
      return { following: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(post_follow)
        .where(
          and(
            eq(post_follow.userId, ctx.session.user.id),
            eq(post_follow.postId, input.postId),
          ),
        );
      return { following: false };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ id: post_follow.id })
        .from(post_follow)
        .where(
          and(
            eq(post_follow.userId, ctx.session.user.id),
            eq(post_follow.postId, input.postId),
          ),
        )
        .limit(1);
      return !!row;
    }),

  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(25),
        cursor: z.number().nullish(),
        view: z.enum(["all", "following"]).default("all"),
        sort: z.enum(["recent", "active", "top"]).default("recent"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const { limit, view, sort } = input;
      const offset = input.cursor ?? 0;

      // Following view requires auth and returns empty when signed out.
      if (view === "following" && !userId) {
        return { items: [], nextCursor: undefined };
      }

      const conditions = [
        eq(posts.status, "published"),
        inArray(posts.type, ["discussion", "question"] as const),
      ];

      if (view === "following" && userId) {
        conditions.push(
          sql`EXISTS (SELECT 1 FROM ${post_follow} WHERE ${post_follow.postId} = ${posts.id} AND ${post_follow.userId} = ${userId})`,
        );
      }

      const scoreExpr = sql<number>`(${posts.upvotesCount} - ${posts.downvotesCount})`;
      const orderBy =
        sort === "top"
          ? desc(scoreExpr)
          : sort === "active"
            ? desc(posts.commentsCount)
            : desc(posts.publishedAt);

      const userBookmarks = userId
        ? ctx.db
            .select({ postId: bookmarks.postId })
            .from(bookmarks)
            .where(eq(bookmarks.userId, userId))
            .as("userBookmarks")
        : null;

      const userVotes = userId
        ? ctx.db
            .select({
              postId: post_votes.postId,
              voteType: post_votes.voteType,
            })
            .from(post_votes)
            .where(eq(post_votes.userId, userId))
            .as("userVotes")
        : null;

      const baseSelect = {
        id: posts.id,
        type: posts.type,
        title: posts.title,
        excerpt: posts.excerpt,
        imageUrl: posts.coverImage,
        ogImageUrl: posts.coverImage,
        slug: posts.slug,
        urlId: posts.urlId,
        publishedAt: posts.publishedAt,
        upvotes: posts.upvotesCount,
        downvotes: posts.downvotesCount,
        commentsCount: posts.commentsCount,
        userId: posts.authorId,
        sourceId: posts.sourceId,
        authorName: user.name,
        authorUsername: user.username,
        authorImage: user.image,
      };

      let results;
      if (userVotes && userBookmarks) {
        results = await ctx.db
          .select({
            ...baseSelect,
            userVote: userVotes.voteType,
            isBookmarked: sql<boolean>`${userBookmarks.postId} IS NOT NULL`,
          })
          .from(posts)
          .leftJoin(user, eq(posts.authorId, user.id))
          .leftJoin(userVotes, eq(posts.id, userVotes.postId))
          .leftJoin(userBookmarks, eq(posts.id, userBookmarks.postId))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1)
          .offset(offset);
      } else {
        results = await ctx.db
          .select({
            ...baseSelect,
            userVote: sql<"up" | "down" | null>`NULL`,
            isBookmarked: sql<boolean>`FALSE`,
          })
          .from(posts)
          .leftJoin(user, eq(posts.authorId, user.id))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1)
          .offset(offset);
      }

      let nextCursor: number | undefined;
      if (results.length > limit) {
        results.pop();
        nextCursor = offset + limit;
      }

      const typeMap: Record<string, string> = {
        discussion: "DISCUSSION",
        question: "QUESTION",
      };
      const items = results.map((item) => ({
        ...item,
        type: typeMap[item.type] ?? item.type.toUpperCase(),
      }));

      return { items, nextCursor };
    }),
});
