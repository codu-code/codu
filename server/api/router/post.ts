import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { award } from "@/server/lib/engagement";
import {
  isModerationEnabled,
  screenContent,
  notifyAdminOfReview,
} from "@/server/lib/moderation";
import {
  GetFeedSchema,
  GetPostByIdSchema,
  GetPostBySlugSchema,
  CreatePostSchema,
  SavePostSchema,
  DeletePostSchema,
  VotePostSchema,
  BookmarkPostSchema,
  GetUserPostsSchema,
  GetBookmarkedPostsSchema,
  GetByIdSchema,
  PublishPostSchema,
  GetPostsSchema,
  GetLimitSidePosts,
  FeaturePostSchema,
  PinPostSchema,
} from "@/schema/post";
import {
  posts,
  postVotes,
  bookmarks,
  postTags,
  feedSources,
  comments,
  tag,
  user,
  banned_users,
  point_event,
} from "@/server/db/schema";
import {
  and,
  eq,
  desc,
  lt,
  lte,
  gt,
  gte,
  sql,
  isNotNull,
  count,
  asc,
  isNull,
} from "drizzle-orm";
import { increment } from "./utils";
import { enforceRateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";
import crypto from "crypto";

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
  const uniqueId = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${uniqueId}`;
}

function calculateReadTime(body: string | null | undefined): number {
  if (!body) return 1;
  const wordsPerMinute = 200;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export const postRouter = createTRPCRouter({
  getFeed: publicProcedure
    .input(GetFeedSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 25;
      const { cursor, sort, type, sourceId, authorId } = input;

      const userVotesSubquery = userId
        ? ctx.db
            .select({
              postId: postVotes.postId,
              voteType: postVotes.voteType,
            })
            .from(postVotes)
            .where(eq(postVotes.userId, userId))
            .as("userVotes")
        : null;

      const userBookmarksSubquery = userId
        ? ctx.db
            .select({
              postId: bookmarks.postId,
            })
            .from(bookmarks)
            .where(eq(bookmarks.userId, userId))
            .as("userBookmarks")
        : null;

      const scoreExpr = sql<number>`(${posts.upvotesCount} - ${posts.downvotesCount})`;

      const conditions = [
        eq(posts.status, "published"),
        isNull(banned_users.userId),
      ];

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      if (sourceId) {
        conditions.push(eq(posts.sourceId, sourceId));
      }

      if (authorId) {
        conditions.push(eq(posts.authorId, authorId));
      }

      const getOrderAndCursor = () => {
        switch (sort) {
          case "recent":
            return {
              orderBy: desc(posts.publishedAt),
              cursorCondition: cursor?.publishedAt
                ? lte(posts.publishedAt, cursor.publishedAt)
                : undefined,
            };
          case "trending":
            return {
              orderBy: desc(scoreExpr),
              cursorCondition:
                cursor?.score !== undefined
                  ? lt(scoreExpr, cursor.score)
                  : undefined,
            };
          case "popular":
            return {
              orderBy: desc(posts.upvotesCount),
              cursorCondition:
                cursor?.score !== undefined
                  ? lt(posts.upvotesCount, cursor.score)
                  : undefined,
            };
          default:
            return {
              orderBy: desc(posts.publishedAt),
              cursorCondition: undefined,
            };
        }
      };

      const { orderBy, cursorCondition } = getOrderAndCursor();

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }

      let query;
      if (userVotesSubquery && userBookmarksSubquery) {
        query = ctx.db
          .select({
            id: posts.id,
            type: posts.type,
            title: posts.title,
            excerpt: posts.excerpt,
            body: posts.body,
            externalUrl: posts.externalUrl,
            coverImage: posts.coverImage,
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            upvotesCount: posts.upvotesCount,
            downvotesCount: posts.downvotesCount,
            commentsCount: posts.commentsCount,
            viewsCount: posts.viewsCount,
            readingTime: posts.readingTime,
            authorId: posts.authorId,
            sourceId: posts.sourceId,
            sourceAuthor: posts.sourceAuthor,
            featured: posts.featured,
            pinnedUntil: posts.pinnedUntil,
            createdAt: posts.createdAt,
            sourceName: feedSources.name,
            sourceSlug: feedSources.slug,
            sourceLogo: feedSources.logoUrl,
            sourceWebsite: feedSources.websiteUrl,
            sourceCategory: feedSources.category,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            userVote: userVotesSubquery.voteType,
            isBookmarked: sql<boolean>`${userBookmarksSubquery.postId} IS NOT NULL`,
          })
          .from(posts)
          .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
          .leftJoin(user, eq(posts.authorId, user.id))
          .leftJoin(banned_users, eq(posts.authorId, banned_users.userId))
          .leftJoin(userVotesSubquery, eq(posts.id, userVotesSubquery.postId))
          .leftJoin(
            userBookmarksSubquery,
            eq(posts.id, userBookmarksSubquery.postId),
          )
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1);
      } else {
        query = ctx.db
          .select({
            id: posts.id,
            type: posts.type,
            title: posts.title,
            excerpt: posts.excerpt,
            body: posts.body,
            externalUrl: posts.externalUrl,
            coverImage: posts.coverImage,
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            upvotesCount: posts.upvotesCount,
            downvotesCount: posts.downvotesCount,
            commentsCount: posts.commentsCount,
            viewsCount: posts.viewsCount,
            readingTime: posts.readingTime,
            authorId: posts.authorId,
            sourceId: posts.sourceId,
            sourceAuthor: posts.sourceAuthor,
            featured: posts.featured,
            pinnedUntil: posts.pinnedUntil,
            createdAt: posts.createdAt,
            sourceName: feedSources.name,
            sourceSlug: feedSources.slug,
            sourceLogo: feedSources.logoUrl,
            sourceWebsite: feedSources.websiteUrl,
            sourceCategory: feedSources.category,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // null when not logged in
            userVote: sql<"up" | "down" | null>`NULL`,
            isBookmarked: sql<boolean>`FALSE`,
          })
          .from(posts)
          .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
          .leftJoin(user, eq(posts.authorId, user.id))
          .leftJoin(banned_users, eq(posts.authorId, banned_users.userId))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1);
      }

      const results = await query;

      let nextCursor:
        | { id: string; publishedAt?: string; score?: number }
        | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        const score = lastItem.upvotesCount - lastItem.downvotesCount;
        nextCursor = {
          id: lastItem.id,
          publishedAt: lastItem.publishedAt || undefined,
          score,
        };
      }

      return {
        items: results,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(GetPostByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          coverImage: posts.coverImage,
          slug: posts.slug,
          canonicalUrl: posts.canonicalUrl,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          commentsCount: posts.commentsCount,
          viewsCount: posts.viewsCount,
          readingTime: posts.readingTime,
          showComments: posts.showComments,
          authorId: posts.authorId,
          sourceId: posts.sourceId,
          sourceAuthor: posts.sourceAuthor,
          status: posts.status,
          featured: posts.featured,
          pinnedUntil: posts.pinnedUntil,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          sourceName: feedSources.name,
          sourceSlug: feedSources.slug,
          sourceLogo: feedSources.logoUrl,
          sourceWebsite: feedSources.websiteUrl,
          sourceCategory: feedSources.category,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(posts)
        .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const item = results[0];

      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: postVotes.voteType })
            .from(postVotes)
            .where(
              and(eq(postVotes.postId, input.id), eq(postVotes.userId, userId)),
            )
            .limit(1),
          ctx.db
            .select({ id: bookmarks.id })
            .from(bookmarks)
            .where(
              and(eq(bookmarks.postId, input.id), eq(bookmarks.userId, userId)),
            )
            .limit(1),
        ]);

        userVote = voteResult[0]?.voteType ?? null;
        isBookmarked = bookmarkResult.length > 0;
      }

      return {
        ...item,
        userVote,
        isBookmarked,
      };
    }),

  getBySlug: publicProcedure
    .input(GetPostBySlugSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          coverImage: posts.coverImage,
          slug: posts.slug,
          canonicalUrl: posts.canonicalUrl,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          commentsCount: posts.commentsCount,
          viewsCount: posts.viewsCount,
          readingTime: posts.readingTime,
          showComments: posts.showComments,
          authorId: posts.authorId,
          sourceId: posts.sourceId,
          sourceAuthor: posts.sourceAuthor,
          status: posts.status,
          featured: posts.featured,
          pinnedUntil: posts.pinnedUntil,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          sourceName: feedSources.name,
          sourceSlug: feedSources.slug,
          sourceLogo: feedSources.logoUrl,
          sourceWebsite: feedSources.websiteUrl,
          sourceCategory: feedSources.category,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(posts)
        .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.slug, input.slug))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const item = results[0];

      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: postVotes.voteType })
            .from(postVotes)
            .where(
              and(eq(postVotes.postId, item.id), eq(postVotes.userId, userId)),
            )
            .limit(1),
          ctx.db
            .select({ id: bookmarks.id })
            .from(bookmarks)
            .where(
              and(eq(bookmarks.postId, item.id), eq(bookmarks.userId, userId)),
            )
            .limit(1),
        ]);

        userVote = voteResult[0]?.voteType ?? null;
        isBookmarked = bookmarkResult.length > 0;
      }

      return {
        ...item,
        userVote,
        isBookmarked,
      };
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

      if (input.type === "article" && !input.body) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Body is required for articles",
        });
      }

      if (
        (input.type === "link" || input.type === "resource") &&
        !input.externalUrl
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "External URL is required for links and resources",
        });
      }

      const slug = generateSlug(input.title);
      const readingTime = calculateReadTime(input.body);

      // Moderation gate (default off): route would-be-live creates to in_review so a client can't self-publish around review.
      const moderated = input.status === "published" && isModerationEnabled();
      if (moderated) {
        screenContent({ title: input.title, body: input.body });
      }
      const dbStatus = moderated ? "in_review" : input.status;

      const [newPost] = await ctx.db
        .insert(posts)
        .values({
          type: input.type,
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          externalUrl: input.externalUrl,
          coverImage: input.coverImage,
          canonicalUrl: input.canonicalUrl,
          authorId,
          slug,
          readingTime,
          status: dbStatus,
          // No publishedAt while in review — admin approval sets it.
          publishedAt:
            input.status === "published" && !moderated
              ? new Date().toISOString()
              : null,
          showComments: input.showComments,
        })
        .returning();

      if (newPost && moderated) {
        void notifyAdminOfReview({
          postId: newPost.id,
          title: input.title,
          authorName: ctx.session.user.name,
        });
      }

      // Skipped under moderation — the admin-approval path awards on publish instead.
      if (newPost && input.status === "published" && !moderated) {
        await award({
          userId: authorId,
          action: "post_published",
          sourceType: "post",
          sourceId: newPost.id,
        });
      }

      if (input.tags && input.tags.length > 0) {
        for (const tagName of input.tags) {
          const existingTags = await ctx.db
            .select({ id: tag.id })
            .from(tag)
            .where(eq(tag.title, tagName.toLowerCase()))
            .limit(1);

          let tagId: number;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            const [newTag] = await ctx.db
              .insert(tag)
              .values({ title: tagName.toLowerCase() })
              .returning();
            tagId = newTag.id;
          }

          await ctx.db
            .insert(postTags)
            .values({ postId: newPost.id, tagId })
            .onConflictDoNothing();
        }
      }

      return newPost;
    }),

  update: protectedProcedure
    .input(SavePostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

      const existing = await ctx.db
        .select({
          authorId: posts.authorId,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          status: posts.status,
        })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (existing[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own posts",
        });
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (input.title !== undefined) updateData.title = input.title;
      if (input.body !== undefined) {
        updateData.body = input.body;
        updateData.readingTime = calculateReadTime(input.body);
      }
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.canonicalUrl !== undefined)
        updateData.canonicalUrl = input.canonicalUrl || null;

      // Moderation gate (default off): a draft→live transition via update must go through review too, else a client self-publishes by setting status here instead of calling publish.
      const goingLive =
        input.status === "published" && existing[0].status !== "published";
      const moderated = goingLive && isModerationEnabled();
      if (input.status !== undefined) {
        if (moderated) {
          screenContent({
            title: input.title ?? existing[0].title,
            body: input.body ?? existing[0].body,
          });
          updateData.status = "in_review";
          // No publishedAt while in review — admin approval sets it.
        } else {
          updateData.status = input.status;
          if (input.status === "published" && input.publishedAt) {
            updateData.publishedAt = input.publishedAt;
          } else if (input.status === "published") {
            updateData.publishedAt = new Date().toISOString();
          }
        }
      }

      const [updated] = await ctx.db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, input.id))
        .returning();

      if (updated && moderated) {
        void notifyAdminOfReview({
          postId: input.id,
          title: input.title ?? existing[0].title,
          authorName: ctx.session.user.name,
        });
      }

      if (input.tags !== undefined) {
        await ctx.db.delete(postTags).where(eq(postTags.postId, input.id));

        for (const tagName of input.tags) {
          const existingTags = await ctx.db
            .select({ id: tag.id })
            .from(tag)
            .where(eq(tag.title, tagName.toLowerCase()))
            .limit(1);

          let tagId: number;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            const [newTag] = await ctx.db
              .insert(tag)
              .values({ title: tagName.toLowerCase() })
              .returning();
            tagId = newTag.id;
          }

          await ctx.db
            .insert(postTags)
            .values({ postId: input.id, tagId })
            .onConflictDoNothing();
        }
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(DeletePostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "ADMIN";

      const existing = await ctx.db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (!isAdmin && existing[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      await ctx.db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    }),

  vote: protectedProcedure
    .input(VotePostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { postId, voteType } = input;

      // Check if post exists (author needed for upvote points).
      const postItem = await ctx.db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const existingVote = await ctx.db
        .select({ id: postVotes.id, voteType: postVotes.voteType })
        .from(postVotes)
        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)))
        .limit(1);

      // Whether a previous "up" vote is going away (removed or switched to
      // "down"). Used to revoke the author's upvote_received points.
      const revokingUpvote =
        existingVote.length > 0 &&
        existingVote[0].voteType === "up" &&
        voteType !== "up";

      // Database triggers handle vote count updates automatically (tr_post_vote_counts)
      if (voteType === null) {
        if (existingVote.length > 0) {
          await ctx.db
            .delete(postVotes)
            .where(eq(postVotes.id, existingVote[0].id));
        }
      } else if (existingVote.length === 0) {
        await ctx.db.insert(postVotes).values({
          postId,
          userId,
          voteType,
        });
      } else if (existingVote[0].voteType !== voteType) {
        await ctx.db
          .update(postVotes)
          .set({ voteType })
          .where(eq(postVotes.id, existingVote[0].id));
      }

      // Mirror content.vote so the author earns points consistently whichever
      // vote path the UI uses. The dedupe index makes the award idempotent per
      // (voter, post), so awarding from both routers can't double-count.
      if (revokingUpvote) {
        await ctx.db
          .delete(point_event)
          .where(
            and(
              eq(point_event.action, "upvote_received"),
              eq(point_event.sourceId, postId),
              eq(point_event.actorId, userId),
            ),
          );
      }

      if (
        voteType === "up" &&
        postItem[0].authorId &&
        postItem[0].authorId !== userId
      ) {
        await award({
          userId: postItem[0].authorId,
          action: "upvote_received",
          sourceType: "post",
          sourceId: postId,
          actorId: userId,
        });
      }

      return { voteType };
    }),

  bookmark: protectedProcedure
    .input(BookmarkPostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { postId, setBookmarked } = input;

      const postItem = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(bookmarks)
          .values({ postId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(bookmarks)
          .where(
            and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)),
          );
      }

      return { success: true };
    }),

  sidebarData: publicProcedure
    .input(GetByIdSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      const [[postData], [userVoteData], [userBookmark]] = await Promise.all([
        ctx.db
          .select({
            upvotesCount: posts.upvotesCount,
            downvotesCount: posts.downvotesCount,
          })
          .from(posts)
          .where(eq(posts.id, id)),
        userId
          ? ctx.db
              .select({ voteType: postVotes.voteType })
              .from(postVotes)
              .where(
                and(eq(postVotes.postId, id), eq(postVotes.userId, userId)),
              )
          : [null],
        userId
          ? ctx.db
              .select({ id: bookmarks.id })
              .from(bookmarks)
              .where(
                and(eq(bookmarks.postId, id), eq(bookmarks.userId, userId)),
              )
          : [null],
      ]);

      return {
        upvotes: postData?.upvotesCount ?? 0,
        downvotes: postData?.downvotesCount ?? 0,
        userVote:
          (userVoteData as { voteType: "up" | "down" } | null)?.voteType ??
          null,
        currentUserBookmarked: !!userBookmark,
      };
    }),

  getUserPosts: publicProcedure
    .input(GetUserPostsSchema)
    .query(async ({ ctx, input }) => {
      const { authorId: targetAuthorId, type, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      const conditions = [eq(posts.authorId, targetAuthorId)];

      // Only show published posts unless viewing own profile
      if (currentUserId !== targetAuthorId) {
        conditions.push(eq(posts.status, "published"));
      }

      if (type) {
        conditions.push(eq(posts.type, type));
      }

      if (cursor?.publishedAt) {
        conditions.push(lte(posts.publishedAt, cursor.publishedAt));
      }

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          slug: posts.slug,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          commentsCount: posts.commentsCount,
          status: posts.status,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(and(...conditions))
        .orderBy(desc(posts.publishedAt))
        .limit(limit + 1);

      let nextCursor: { id: string; publishedAt?: string } | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        nextCursor = {
          id: lastItem.id,
          publishedAt: lastItem.publishedAt || undefined,
        };
      }

      return {
        items: results,
        nextCursor,
      };
    }),

  myBookmarks: protectedProcedure
    .input(GetBookmarkedPostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { limit, cursor } = input;

      const conditions = [eq(bookmarks.userId, userId)];

      if (cursor?.createdAt) {
        conditions.push(lte(bookmarks.createdAt, cursor.createdAt));
      }

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          slug: posts.slug,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          readingTime: posts.readingTime,
          sourceName: feedSources.name,
          sourceSlug: feedSources.slug,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
          bookmarkedAt: bookmarks.createdAt,
        })
        .from(bookmarks)
        .innerJoin(posts, eq(bookmarks.postId, posts.id))
        .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(and(...conditions))
        .orderBy(desc(bookmarks.createdAt))
        .limit(limit + 1);

      let nextCursor: { id: string; createdAt?: string } | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        nextCursor = {
          id: lastItem.id,
          createdAt: lastItem.bookmarkedAt || undefined,
        };
      }

      return {
        items: results,
        nextCursor,
      };
    }),

  editDraft: protectedProcedure
    .input(GetByIdSchema)
    .query(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          canonicalUrl: posts.canonicalUrl,
          coverImage: posts.coverImage,
          slug: posts.slug,
          status: posts.status,
          publishedAt: posts.publishedAt,
          showComments: posts.showComments,
          readingTime: posts.readingTime,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(and(eq(posts.id, input.id), eq(posts.authorId, authorId)))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found or you don't have permission to edit it",
        });
      }

      const postTagsResult = await ctx.db
        .select({
          tag: {
            id: tag.id,
            title: tag.title,
          },
        })
        .from(postTags)
        .innerJoin(tag, eq(postTags.tagId, tag.id))
        .where(eq(postTags.postId, input.id));

      return {
        ...results[0],
        tags: postTagsResult,
      };
    }),

  myDrafts: protectedProcedure.query(async ({ ctx }) => {
    const authorId = ctx.session.user.id;

    return await ctx.db
      .select({
        id: posts.id,
        type: posts.type,
        title: posts.title,
        excerpt: posts.excerpt,
        slug: posts.slug,
        status: posts.status,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, authorId),
          eq(posts.type, "article"),
          eq(posts.status, "draft"),
        ),
      )
      .orderBy(desc(posts.updatedAt));
  }),

  myPublished: protectedProcedure.query(async ({ ctx }) => {
    const authorId = ctx.session.user.id;
    const now = new Date().toISOString();

    return await ctx.db
      .select({
        id: posts.id,
        type: posts.type,
        title: posts.title,
        excerpt: posts.excerpt,
        slug: posts.slug,
        status: posts.status,
        publishedAt: posts.publishedAt,
        upvotesCount: posts.upvotesCount,
        downvotesCount: posts.downvotesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, authorId),
          eq(posts.type, "article"),
          eq(posts.status, "published"),
          lte(posts.publishedAt, now),
        ),
      )
      .orderBy(desc(posts.publishedAt));
  }),

  myScheduled: protectedProcedure.query(async ({ ctx }) => {
    const authorId = ctx.session.user.id;
    const now = new Date().toISOString();

    return await ctx.db
      .select({
        id: posts.id,
        type: posts.type,
        title: posts.title,
        excerpt: posts.excerpt,
        slug: posts.slug,
        status: posts.status,
        publishedAt: posts.publishedAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        and(
          eq(posts.authorId, authorId),
          eq(posts.type, "article"),
          eq(posts.status, "scheduled"),
          gt(posts.publishedAt, now),
        ),
      )
      .orderBy(asc(posts.publishedAt));
  }),

  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;

      const existing = await ctx.db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          title: posts.title,
          body: posts.body,
          slug: posts.slug,
          status: posts.status,
        })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (existing[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only publish your own posts",
        });
      }

      const updateData: Record<string, unknown> = {};

      if (input.published) {
        // Throttle so a user can't mass-create drafts then publish-loop to flood the feed.
        await enforceRateLimit({
          key: `create:${authorId}`,
          limit: 10,
          windowMs: 5 * 60_000,
          message: "You're posting too fast. Take a breather and try again.",
        });

        // Moderation gate (default off): first-time publish of a draft routes to in_review with no publishedAt/points — admin approval handles both.
        if (isModerationEnabled() && existing[0].status === "draft") {
          // Advisory screen only — a failing screen still goes to in_review.
          screenContent({ title: existing[0].title, body: existing[0].body });
          updateData.status = "in_review";
          if (existing[0].title) {
            updateData.slug = generateSlug(existing[0].title);
          }

          const [reviewed] = await ctx.db
            .update(posts)
            .set(updateData)
            .where(eq(posts.id, input.id))
            .returning();

          void notifyAdminOfReview({
            postId: input.id,
            title: existing[0].title,
            authorName: ctx.session.user.name,
          });

          return reviewed;
        }

        updateData.status = "published";
        if (input.publishTime) {
          updateData.publishedAt = input.publishTime.toISOString();
          if (input.publishTime > new Date()) {
            updateData.status = "scheduled";
          }
        } else {
          updateData.publishedAt = new Date().toISOString();
        }

        if (existing[0].status === "draft" && existing[0].title) {
          updateData.slug = generateSlug(existing[0].title);
        }
      } else {
        updateData.status = "draft";
      }

      const [updated] = await ctx.db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, input.id))
        .returning();

      return updated;
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .selectDistinct({ category: feedSources.category })
      .from(feedSources)
      .where(isNotNull(feedSources.category));

    return results
      .map((r) => r.category)
      .filter((c): c is string => c !== null)
      .sort();
  }),

  getTypeCounts: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select({
        type: posts.type,
        count: count(),
      })
      .from(posts)
      .where(eq(posts.status, "published"))
      .groupBy(posts.type);

    return results;
  }),

  trackView: publicProcedure
    .input(GetByIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Feeds trending/popular sort — throttle per client+post so it can't be scripted to inflate view counts.
      const identifier =
        ctx.session?.user?.id ?? `ip:${clientIpFromHeaders(ctx.headers)}`;
      await enforceRateLimit({
        key: `trackView:${identifier}:${input.id}`,
        limit: 10,
        windowMs: 60_000,
      });

      await ctx.db
        .update(posts)
        .set({ viewsCount: increment(posts.viewsCount) })
        .where(and(eq(posts.id, input.id), eq(posts.status, "published")));

      return { success: true };
    }),

  feature: protectedProcedure
    .input(FeaturePostSchema)
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can feature posts",
        });
      }

      const [updated] = await ctx.db
        .update(posts)
        .set({ featured: input.featured })
        .where(eq(posts.id, input.postId))
        .returning();

      return updated;
    }),

  pin: protectedProcedure
    .input(PinPostSchema)
    .mutation(async ({ ctx, input }) => {
      const isAdmin = ctx.session.user.role === "ADMIN";

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can pin posts",
        });
      }

      const [updated] = await ctx.db
        .update(posts)
        .set({ pinnedUntil: input.pinnedUntil?.toISOString() ?? null })
        .where(eq(posts.id, input.postId))
        .returning();

      return updated;
    }),

  getFeatured: publicProcedure
    .input(GetLimitSidePosts)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 5;

      return await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          slug: posts.slug,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          commentsCount: posts.commentsCount,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(posts)
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(and(eq(posts.status, "published"), eq(posts.featured, true)))
        .orderBy(desc(posts.publishedAt))
        .limit(limit);
    }),

  getCommentCount: publicProcedure
    .input(GetByIdSchema)
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({ count: count() })
        .from(comments)
        .where(and(eq(comments.postId, input.id), isNull(comments.deletedAt)));

      return result.count;
    }),

  // Legacy: kept for backwards compatibility.
  published: publicProcedure
    .input(GetPostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 50;
      const { cursor, sort, tag: tagFilter } = input;

      // Reddit-style hot score calculation
      const hotScoreExpr = sql<number>`
        LOG(GREATEST(ABS(${posts.upvotesCount} - ${posts.downvotesCount}), 1)) +
        SIGN(${posts.upvotesCount} - ${posts.downvotesCount}) *
        EXTRACT(EPOCH FROM (${posts.publishedAt}::timestamp - '2024-01-01'::timestamp)) / 45000
      `;

      const paginationMapping = {
        newest: {
          orderBy: desc(posts.publishedAt),
          cursor: cursor?.published
            ? lte(posts.publishedAt, cursor.published)
            : undefined,
        },
        oldest: {
          orderBy: asc(posts.publishedAt),
          cursor: cursor?.published
            ? gte(posts.publishedAt, cursor.published)
            : undefined,
        },
        top: {
          orderBy: desc(sql`${posts.upvotesCount} - ${posts.downvotesCount}`),
          cursor:
            cursor?.likes !== undefined
              ? lt(
                  sql`${posts.upvotesCount} - ${posts.downvotesCount}`,
                  cursor.likes,
                )
              : undefined,
        },
        trending: {
          orderBy: desc(hotScoreExpr),
          cursor:
            cursor?.hotScore !== undefined
              ? lt(hotScoreExpr, cursor.hotScore)
              : undefined,
        },
      };

      const userBookmarksSubquery = ctx.db
        .select()
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId || ""))
        .as("bookmarked");

      const userVotesSubquery = ctx.db
        .select()
        .from(postVotes)
        .where(eq(postVotes.userId, userId || ""))
        .as("userVote");

      const response = await ctx.db
        .select({
          post: {
            id: posts.id,
            slug: posts.slug,
            title: posts.title,
            excerpt: posts.excerpt,
            published: posts.publishedAt,
            readTimeMins: posts.readingTime,
            upvotes: posts.upvotesCount,
            downvotes: posts.downvotesCount,
          },
          bookmarked: { id: userBookmarksSubquery.id },
          userVote: { voteType: userVotesSubquery.voteType },
          user: { name: user.name, username: user.username, image: user.image },
        })
        .from(posts)
        .leftJoin(user, eq(posts.authorId, user.id))
        .leftJoin(
          userBookmarksSubquery,
          eq(userBookmarksSubquery.postId, posts.id),
        )
        .leftJoin(userVotesSubquery, eq(userVotesSubquery.postId, posts.id))
        .leftJoin(postTags, eq(posts.id, postTags.postId))
        .leftJoin(tag, eq(postTags.tagId, tag.id))
        .where(
          and(
            eq(posts.status, "published"),
            lte(posts.publishedAt, new Date().toISOString()),
            tagFilter ? eq(tag.title, tagFilter.toUpperCase()) : undefined,
            cursor ? paginationMapping[sort].cursor : undefined,
          ),
        )
        .groupBy(
          posts.id,
          posts.slug,
          posts.title,
          posts.excerpt,
          posts.publishedAt,
          posts.readingTime,
          posts.upvotesCount,
          posts.downvotesCount,
          userBookmarksSubquery.id,
          userVotesSubquery.voteType,
          user.id,
        )
        .limit(limit + 1)
        .orderBy(paginationMapping[sort].orderBy);

      const calculateHotScore = (
        upvotes: number,
        downvotes: number,
        publishedAt: string,
      ): number => {
        const score = upvotes - downvotes;
        const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
        const epoch2024 = new Date("2024-01-01").getTime() / 1000;
        const publishedEpoch = new Date(publishedAt).getTime() / 1000;
        const seconds = publishedEpoch - epoch2024;
        return (
          Math.log10(Math.max(Math.abs(score), 1)) + (sign * seconds) / 45000
        );
      };

      const cleaned = response.map((elem) => {
        const currentUserBookmarkedPost = userId ? !!elem.bookmarked : false;
        const hotScore = calculateHotScore(
          elem.post.upvotes,
          elem.post.downvotes,
          elem.post.published as string,
        );
        return {
          ...elem.post,
          user: elem.user,
          currentUserBookmarkedPost,
          userVote: elem.userVote?.voteType ?? null,
          hotScore,
          likes: elem.post.upvotes,
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (response.length > limit) {
        const nextItem = cleaned.pop();
        if (nextItem)
          nextCursor = {
            id: nextItem?.id,
            published: nextItem.published as string,
            likes: nextItem.likes,
            hotScore: sort === "trending" ? nextItem.hotScore : undefined,
          };
      }

      return { posts: cleaned, nextCursor };
    }),
});
