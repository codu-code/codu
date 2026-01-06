import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  CreateCommentSchema,
  EditCommentSchema,
  DeleteCommentSchema,
  GetCommentsSchema,
  GetRepliesSchema,
  VoteCommentSchema,
} from "@/schema/comment";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "@/utils/notifications";
import {
  comments,
  commentVotes,
  notification,
  posts,
  user,
} from "@/server/db/schema";
import {
  and,
  count,
  desc,
  eq,
  isNull,
  sql,
  asc,
  gt,
  lt,
  like,
} from "drizzle-orm";
import { db } from "@/server/db";
import { increment, decrement } from "./utils";

// Helper to generate ltree-safe ID (no dashes, alphanumeric only)
function generateLtreeId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// Helper to build child ltree path from parent path
function buildChildPath(parentPath: string | null, childId: string): string {
  const safeChildId = childId.replace(/-/g, "");
  return parentPath ? `${parentPath}.${safeChildId}` : safeChildId;
}

// Calculate depth from path
function calculateDepth(path: string): number {
  return path.split(".").length - 1;
}

export const commentRouter = createTRPCRouter({
  // Create a new comment
  create: protectedProcedure
    .input(CreateCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { body, postId, parentId } = input;
      const authorId = ctx.session.user.id;

      // Validate post exists
      const postData = await ctx.db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get parent comment info if this is a reply
      let parentPath: string | null = null;
      let parentAuthorId: string | null = null;

      if (parentId) {
        const parentComment = await ctx.db
          .select({
            id: comments.id,
            path: comments.path,
            authorId: comments.authorId,
            deletedAt: comments.deletedAt,
          })
          .from(comments)
          .where(eq(comments.id, parentId))
          .limit(1);

        if (parentComment.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          });
        }

        // Can reply to deleted comments (tree structure preservation)
        parentPath = parentComment[0].path;
        parentAuthorId = parentComment[0].authorId;
      }

      // Calculate depth from parent path
      const depth = parentPath ? parentPath.split(".").length : 0;

      // Insert the comment first to get the generated ID
      const [insertedComment] = await ctx.db
        .insert(comments)
        .values({
          authorId,
          postId,
          parentId,
          path: "placeholder", // Will be updated after we have the ID
          depth,
          body,
        })
        .returning();

      // Build the ltree path using the returned ID
      const ltreeSafeId = insertedComment.id.replace(/-/g, "");
      const newPath = parentPath ? `${parentPath}.${ltreeSafeId}` : ltreeSafeId;

      // Update the path with the correct ltree value
      const [createdComment] = await ctx.db
        .update(comments)
        .set({ path: newPath })
        .where(eq(comments.id, insertedComment.id))
        .returning();

      // Update post comment count
      await ctx.db
        .update(posts)
        .set({ commentsCount: increment(posts.commentsCount) })
        .where(eq(posts.id, postId));

      // Send notifications
      if (parentId && parentAuthorId && parentAuthorId !== authorId) {
        // Notification for reply to comment
        await ctx.db.insert(notification).values({
          notifierId: authorId,
          type: NEW_REPLY_TO_YOUR_COMMENT,
          userId: parentAuthorId,
        });
      }

      if (
        !parentId &&
        postData[0].authorId &&
        postData[0].authorId !== authorId
      ) {
        // Notification for new top-level comment on post
        await ctx.db.insert(notification).values({
          notifierId: authorId,
          type: NEW_COMMENT_ON_YOUR_POST,
          userId: postData[0].authorId,
        });
      }

      return createdComment;
    }),

  // Edit a comment
  edit: protectedProcedure
    .input(EditCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, body } = input;
      const authorId = ctx.session.user.id;

      const currentComment = await ctx.db
        .select({
          id: comments.id,
          authorId: comments.authorId,
          body: comments.body,
          deletedAt: comments.deletedAt,
        })
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (currentComment.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (currentComment[0].deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot edit a deleted comment",
        });
      }

      if (currentComment[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own comments",
        });
      }

      if (currentComment[0].body === body) {
        return currentComment[0];
      }

      const [updatedComment] = await ctx.db
        .update(comments)
        .set({
          body,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(comments.id, id))
        .returning();

      return updatedComment;
    }),

  // Soft delete a comment
  delete: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const authorId = ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "ADMIN";

      const currentComment = await ctx.db
        .select({
          id: comments.id,
          authorId: comments.authorId,
          postId: comments.postId,
          deletedAt: comments.deletedAt,
        })
        .from(comments)
        .where(eq(comments.id, id))
        .limit(1);

      if (currentComment.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      if (currentComment[0].deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Comment already deleted",
        });
      }

      if (!isAdmin && currentComment[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own comments",
        });
      }

      // Soft delete - set deletedAt timestamp
      // This preserves the tree structure for replies
      const [deletedComment] = await ctx.db
        .update(comments)
        .set({
          deletedAt: new Date().toISOString(),
        })
        .where(eq(comments.id, id))
        .returning();

      // Decrement post comment count
      await ctx.db
        .update(posts)
        .set({ commentsCount: decrement(posts.commentsCount) })
        .where(eq(posts.id, currentComment[0].postId));

      return { id: deletedComment.id, deletedAt: deletedComment.deletedAt };
    }),

  // Vote on a comment (Reddit-style)
  vote: protectedProcedure
    .input(VoteCommentSchema)
    .mutation(async ({ input, ctx }) => {
      const { commentId, voteType } = input;
      const userId = ctx.session.user.id;

      // Check if comment exists and is not deleted
      const commentItem = await ctx.db
        .select({
          id: comments.id,
          deletedAt: comments.deletedAt,
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

      if (commentItem[0].deletedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot vote on a deleted comment",
        });
      }

      // Get existing vote
      const existingVote = await ctx.db
        .select({ id: commentVotes.id, voteType: commentVotes.voteType })
        .from(commentVotes)
        .where(
          and(
            eq(commentVotes.commentId, commentId),
            eq(commentVotes.userId, userId),
          ),
        )
        .limit(1);

      if (voteType === null) {
        // Remove vote
        if (existingVote.length > 0) {
          const oldVoteType = existingVote[0].voteType;
          await ctx.db
            .delete(commentVotes)
            .where(eq(commentVotes.id, existingVote[0].id));

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
        await ctx.db.insert(commentVotes).values({
          commentId,
          userId,
          voteType,
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
          .update(commentVotes)
          .set({ voteType })
          .where(eq(commentVotes.id, existingVote[0].id));

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

  // Get comments for a post with tree structure
  get: publicProcedure
    .input(GetCommentsSchema)
    .query(async ({ ctx, input }) => {
      const { postId, sort = "best", limit = 50 } = input;
      const userId = ctx?.session?.user?.id;

      // Get total count (excluding deleted)
      const [commentCount] = await db
        .select({ count: count() })
        .from(comments)
        .where(and(eq(comments.postId, postId), isNull(comments.deletedAt)));

      // Build user votes subquery if logged in
      const userVotesSubquery = userId
        ? db
            .select({
              commentId: commentVotes.commentId,
              voteType: commentVotes.voteType,
            })
            .from(commentVotes)
            .where(eq(commentVotes.userId, userId))
            .as("userVotes")
        : null;

      // Order by clause based on sort
      const getOrderBy = () => {
        switch (sort) {
          case "best":
          case "top":
            // Score = upvotes - downvotes
            return desc(
              sql`${comments.upvotesCount} - ${comments.downvotesCount}`,
            );
          case "new":
            return desc(comments.createdAt);
          case "old":
            return asc(comments.createdAt);
          case "controversial":
            // More votes but close to 50/50 ratio
            return desc(sql`
              ${comments.upvotesCount} + ${comments.downvotesCount} -
              ABS(${comments.upvotesCount} - ${comments.downvotesCount})
            `);
          default:
            return desc(comments.createdAt);
        }
      };

      // Get top-level comments only (parentId is null)
      let query;
      if (userVotesSubquery) {
        query = db
          .select({
            id: comments.id,
            postId: comments.postId,
            authorId: comments.authorId,
            parentId: comments.parentId,
            path: comments.path,
            depth: comments.depth,
            body: comments.body,
            upvotesCount: comments.upvotesCount,
            downvotesCount: comments.downvotesCount,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            deletedAt: comments.deletedAt,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User vote
            userVote: userVotesSubquery.voteType,
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorId, user.id))
          .leftJoin(
            userVotesSubquery,
            eq(comments.id, userVotesSubquery.commentId),
          )
          .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
          .orderBy(getOrderBy())
          .limit(limit);
      } else {
        query = db
          .select({
            id: comments.id,
            postId: comments.postId,
            authorId: comments.authorId,
            parentId: comments.parentId,
            path: comments.path,
            depth: comments.depth,
            body: comments.body,
            upvotesCount: comments.upvotesCount,
            downvotesCount: comments.downvotesCount,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            deletedAt: comments.deletedAt,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User vote (null when not logged in)
            userVote: sql<"up" | "down" | null>`NULL`,
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorId, user.id))
          .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
          .orderBy(getOrderBy())
          .limit(limit);
      }

      const topLevelComments = await query;

      // For each top-level comment, fetch all children using ltree path prefix
      const commentsWithChildren = await Promise.all(
        topLevelComments.map(async (topComment) => {
          // Get all descendants using path prefix matching
          // Use SQL LIKE for path matching since ltree might not be available in Drizzle
          const pathPrefix = `${topComment.path}.%`;

          let childrenQuery;
          if (userVotesSubquery) {
            childrenQuery = db
              .select({
                id: comments.id,
                postId: comments.postId,
                authorId: comments.authorId,
                parentId: comments.parentId,
                path: comments.path,
                depth: comments.depth,
                body: comments.body,
                upvotesCount: comments.upvotesCount,
                downvotesCount: comments.downvotesCount,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                deletedAt: comments.deletedAt,
                authorName: user.name,
                authorUsername: user.username,
                authorImage: user.image,
                userVote: userVotesSubquery.voteType,
              })
              .from(comments)
              .leftJoin(user, eq(comments.authorId, user.id))
              .leftJoin(
                userVotesSubquery,
                eq(comments.id, userVotesSubquery.commentId),
              )
              .where(
                and(
                  eq(comments.postId, postId),
                  like(comments.path, pathPrefix),
                ),
              )
              .orderBy(asc(comments.path)); // Order by path for tree reconstruction
          } else {
            childrenQuery = db
              .select({
                id: comments.id,
                postId: comments.postId,
                authorId: comments.authorId,
                parentId: comments.parentId,
                path: comments.path,
                depth: comments.depth,
                body: comments.body,
                upvotesCount: comments.upvotesCount,
                downvotesCount: comments.downvotesCount,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                deletedAt: comments.deletedAt,
                authorName: user.name,
                authorUsername: user.username,
                authorImage: user.image,
                userVote: sql<"up" | "down" | null>`NULL`,
              })
              .from(comments)
              .leftJoin(user, eq(comments.authorId, user.id))
              .where(
                and(
                  eq(comments.postId, postId),
                  like(comments.path, pathPrefix),
                ),
              )
              .orderBy(asc(comments.path));
          }

          const children = await childrenQuery;

          // Build tree structure from flat list
          return buildCommentTree(topComment, children);
        }),
      );

      return {
        data: commentsWithChildren,
        count: commentCount.count,
      };
    }),

  // Get comment count for a post
  getPostCommentCount: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select({ count: count() })
        .from(comments)
        .where(
          and(eq(comments.postId, input.postId), isNull(comments.deletedAt)),
        );

      return result.count;
    }),

  // Get direct replies to a comment (for lazy loading)
  getReplies: publicProcedure
    .input(GetRepliesSchema)
    .query(async ({ ctx, input }) => {
      const { parentId, limit = 10 } = input;
      const userId = ctx?.session?.user?.id;

      const userVotesSubquery = userId
        ? db
            .select({
              commentId: commentVotes.commentId,
              voteType: commentVotes.voteType,
            })
            .from(commentVotes)
            .where(eq(commentVotes.userId, userId))
            .as("userVotes")
        : null;

      let query;
      if (userVotesSubquery) {
        query = db
          .select({
            id: comments.id,
            postId: comments.postId,
            authorId: comments.authorId,
            parentId: comments.parentId,
            path: comments.path,
            depth: comments.depth,
            body: comments.body,
            upvotesCount: comments.upvotesCount,
            downvotesCount: comments.downvotesCount,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            deletedAt: comments.deletedAt,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            userVote: userVotesSubquery.voteType,
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorId, user.id))
          .leftJoin(
            userVotesSubquery,
            eq(comments.id, userVotesSubquery.commentId),
          )
          .where(eq(comments.parentId, parentId))
          .orderBy(
            desc(sql`${comments.upvotesCount} - ${comments.downvotesCount}`),
          )
          .limit(limit);
      } else {
        query = db
          .select({
            id: comments.id,
            postId: comments.postId,
            authorId: comments.authorId,
            parentId: comments.parentId,
            path: comments.path,
            depth: comments.depth,
            body: comments.body,
            upvotesCount: comments.upvotesCount,
            downvotesCount: comments.downvotesCount,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            deletedAt: comments.deletedAt,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            userVote: sql<"up" | "down" | null>`NULL`,
          })
          .from(comments)
          .leftJoin(user, eq(comments.authorId, user.id))
          .where(eq(comments.parentId, parentId))
          .orderBy(
            desc(sql`${comments.upvotesCount} - ${comments.downvotesCount}`),
          )
          .limit(limit);
      }

      const replies = await query;

      return replies.map(shapeComment);
    }),
});

// Shape a single comment for API response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shapeComment(comment: any) {
  const isDeleted = !!comment.deletedAt;

  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    depth: comment.depth,
    // If deleted, hide body and author info
    body: isDeleted ? null : comment.body,
    author: isDeleted
      ? null
      : {
          id: comment.authorId,
          name: comment.authorName,
          username: comment.authorUsername,
          image: comment.authorImage,
        },
    score: comment.upvotesCount - comment.downvotesCount,
    upvotesCount: comment.upvotesCount,
    downvotesCount: comment.downvotesCount,
    userVote: comment.userVote ?? null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt,
    isDeleted,
  };
}

// Build tree structure from flat list of comments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCommentTree(rootComment: any, descendants: any[]) {
  // Create a map of id -> comment with children array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentMap = new Map<string, any>();

  // Initialize root
  const shapedRoot = {
    ...shapeComment(rootComment),
    children: [] as ReturnType<typeof shapeComment>[],
  };
  commentMap.set(rootComment.id, shapedRoot);

  // Add all descendants to map
  for (const comment of descendants) {
    const shapedComment = {
      ...shapeComment(comment),
      children: [] as ReturnType<typeof shapeComment>[],
    };
    commentMap.set(comment.id, shapedComment);
  }

  // Build tree by connecting children to parents
  for (const comment of descendants) {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId);
      const child = commentMap.get(comment.id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  }

  return shapedRoot;
}
