import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  GetUnifiedFeedSchema,
  GetContentByIdSchema,
  GetContentBySlugSchema,
  CreateContentSchema,
  UpdateContentSchema,
  DeleteContentSchema,
  VoteContentSchema,
  BookmarkContentSchema,
  TrackClickContentSchema,
  GetUserContentSchema,
  GetSavedContentSchema,
  EditDraftContentSchema,
  PublishContentSchema,
  MyDraftsContentSchema,
  MyPublishedContentSchema,
  MyScheduledContentSchema,
} from "../../../schema/content";
import {
  posts,
  post_votes,
  bookmarks,
  post_tags,
  feed_sources,
  follow,
  tag as dbTag,
  user,
  comments,
  point_event,
} from "@/server/db/schema";
import {
  and,
  eq,
  desc,
  lt,
  lte,
  sql,
  isNotNull,
  count,
  exists,
  inArray,
} from "drizzle-orm";
import { increment } from "./utils";
import {
  isModerationEnabled,
  screenContent,
  notifyAdminOfReview,
} from "@/server/lib/moderation";
import { enforceRateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";
import { award } from "@/server/lib/engagement";
import crypto from "crypto";

// Helper to generate slug from title
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
  const uniqueId = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${uniqueId}`;
}

// Helper to calculate read time
function calculateReadTime(body: string | null | undefined): number {
  if (!body) return 1;
  const wordsPerMinute = 200;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

type DbPostType =
  | "article"
  | "discussion"
  | "link"
  | "resource"
  | "til"
  | "question";

// Helper to convert frontend type (POST, LINK, ARTICLE) to DB type (article, link)
function toDbType(frontendType: string): DbPostType {
  const typeMap: Record<string, DbPostType> = {
    POST: "article",
    ARTICLE: "article", // Alias for POST
    LINK: "link",
    TIL: "til",
    QUESTION: "question",
    VIDEO: "link",
    DISCUSSION: "discussion",
    article: "article",
    link: "link",
    discussion: "discussion",
    resource: "resource",
    til: "til",
    question: "question",
  };
  return typeMap[frontendType] || "article";
}

// Helper to convert DB type to frontend type (for backwards compatibility)
function toFrontendType(dbType: string): string {
  const typeMap: Record<string, string> = {
    article: "POST",
    link: "LINK",
    discussion: "DISCUSSION",
    resource: "LINK",
    til: "TIL",
    question: "QUESTION",
  };
  return typeMap[dbType] || dbType.toUpperCase();
}

export const contentRouter = createTRPCRouter({
  // Get unified feed with optional type filtering
  getFeed: publicProcedure
    .input(GetUnifiedFeedSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 25;
      const { cursor, sort, type, kinds, sourceId, category, tag, following } =
        input;

      // Build the vote subquery for current user
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

      // Build the bookmark subquery for current user
      const userBookmarks = userId
        ? ctx.db
            .select({
              postId: bookmarks.postId,
            })
            .from(bookmarks)
            .where(eq(bookmarks.userId, userId))
            .as("userBookmarks")
        : null;

      // Calculate score for trending
      const scoreExpr = sql<number>`(${posts.upvotesCount} - ${posts.downvotesCount})`;

      // Build conditions - status = 'published'
      const conditions = [eq(posts.status, "published")];

      if (type) {
        // Convert frontend type (POST, LINK) to db type (article, link)
        const dbType = toDbType(type);
        conditions.push(eq(posts.type, dbType));
      }

      // Multi-kind filter (e.g. Discussions = discussion + question)
      if (kinds && kinds.length > 0) {
        const dbKinds = [...new Set(kinds.map(toDbType))];
        conditions.push(inArray(posts.type, dbKinds));
      }

      if (sourceId) {
        conditions.push(eq(posts.sourceId, sourceId));
      }

      // Filter by category (matches source category)
      if (category) {
        conditions.push(eq(feed_sources.category, category));
      }

      // Filter by tag (matches tag slug via post_tags junction)
      if (tag) {
        conditions.push(
          exists(
            ctx.db
              .select({ one: sql`1` })
              .from(post_tags)
              .innerJoin(dbTag, eq(post_tags.tagId, dbTag.id))
              .where(and(eq(post_tags.postId, posts.id), eq(dbTag.slug, tag))),
          ),
        );
      }

      // Following filter — only authors the current user follows.
      if (following && userId) {
        conditions.push(
          exists(
            ctx.db
              .select({ one: sql`1` })
              .from(follow)
              .where(
                and(
                  eq(follow.followingId, posts.authorId),
                  eq(follow.followerId, userId),
                ),
              ),
          ),
        );
      }

      // Build order by and cursor conditions based on sort type
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

      // Build query
      let query;
      if (userVotes && userBookmarks) {
        query = ctx.db
          .select({
            id: posts.id,
            type: posts.type,
            title: posts.title,
            excerpt: posts.excerpt,
            body: posts.body,
            externalUrl: posts.externalUrl,
            imageUrl: posts.coverImage,
            ogImageUrl: posts.coverImage,
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            upvotes: posts.upvotesCount,
            downvotes: posts.downvotesCount,
            clickCount: posts.viewsCount,
            readTimeMins: posts.readingTime,
            userId: posts.authorId,
            sourceId: posts.sourceId,
            sourceAuthor: posts.sourceAuthor,
            createdAt: posts.createdAt,
            // Source info
            sourceName: feed_sources.name,
            sourceSlug: feed_sources.slug,
            sourceLogo: feed_sources.logoUrl,
            sourceWebsite: feed_sources.websiteUrl,
            sourceCategory: feed_sources.category,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User-specific
            userVote: userVotes.voteType,
            isBookmarked: sql<boolean>`${userBookmarks.postId} IS NOT NULL`,
          })
          .from(posts)
          .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
          .leftJoin(user, eq(posts.authorId, user.id))
          .leftJoin(userVotes, eq(posts.id, userVotes.postId))
          .leftJoin(userBookmarks, eq(posts.id, userBookmarks.postId))
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
            imageUrl: posts.coverImage,
            ogImageUrl: posts.coverImage,
            slug: posts.slug,
            publishedAt: posts.publishedAt,
            upvotes: posts.upvotesCount,
            downvotes: posts.downvotesCount,
            clickCount: posts.viewsCount,
            readTimeMins: posts.readingTime,
            userId: posts.authorId,
            sourceId: posts.sourceId,
            sourceAuthor: posts.sourceAuthor,
            createdAt: posts.createdAt,
            // Source info
            sourceName: feed_sources.name,
            sourceSlug: feed_sources.slug,
            sourceLogo: feed_sources.logoUrl,
            sourceWebsite: feed_sources.websiteUrl,
            sourceCategory: feed_sources.category,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User-specific (null when not logged in)
            userVote: sql<"up" | "down" | null>`NULL`,
            isBookmarked: sql<boolean>`FALSE`,
          })
          .from(posts)
          .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
          .leftJoin(user, eq(posts.authorId, user.id))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1);
      }

      const results = await query;

      // Check if there's a next page
      let nextCursor:
        | { id: string; publishedAt?: string; score?: number }
        | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        const score = lastItem.upvotes - lastItem.downvotes;
        nextCursor = {
          id: lastItem.id,
          publishedAt: lastItem.publishedAt || undefined,
          score,
        };
      }

      // Map types from DB format (article, link) to frontend format (POST, LINK)
      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

  // Get content by ID
  getById: publicProcedure
    .input(GetContentByIdSchema)
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
          imageUrl: posts.coverImage,
          ogImageUrl: posts.coverImage,
          slug: posts.slug,
          canonicalUrl: posts.canonicalUrl,
          coverImage: posts.coverImage,
          publishedAt: posts.publishedAt,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          clickCount: posts.viewsCount,
          readTimeMins: posts.readingTime,
          showComments: posts.showComments,
          userId: posts.authorId,
          sourceId: posts.sourceId,
          sourceAuthor: posts.sourceAuthor,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // Source info
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
          // Author info
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(posts)
        .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      const item = results[0];

      // Get user vote if logged in
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: post_votes.voteType })
            .from(post_votes)
            .where(
              and(
                eq(post_votes.postId, input.id),
                eq(post_votes.userId, userId),
              ),
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

      // Get comments count
      const commentsCountResult = await ctx.db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, input.id));

      return {
        ...item,
        type: toFrontendType(item.type),
        userVote,
        isBookmarked,
        discussionCount: commentsCountResult[0]?.count ?? 0,
      };
    }),

  // Get content by slug
  getBySlug: publicProcedure
    .input(GetContentBySlugSchema)
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
          imageUrl: posts.coverImage,
          ogImageUrl: posts.coverImage,
          slug: posts.slug,
          canonicalUrl: posts.canonicalUrl,
          coverImage: posts.coverImage,
          publishedAt: posts.publishedAt,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          clickCount: posts.viewsCount,
          readTimeMins: posts.readingTime,
          showComments: posts.showComments,
          userId: posts.authorId,
          sourceId: posts.sourceId,
          sourceAuthor: posts.sourceAuthor,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // Source info
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
          // Author info
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(posts)
        .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.slug, input.slug))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      const item = results[0];

      // Get user vote if logged in
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: post_votes.voteType })
            .from(post_votes)
            .where(
              and(
                eq(post_votes.postId, item.id),
                eq(post_votes.userId, userId),
              ),
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

      // Get comments count
      const commentsCountResult = await ctx.db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.postId, item.id));

      return {
        ...item,
        type: toFrontendType(item.type),
        userVote,
        isBookmarked,
        discussionCount: commentsCountResult[0]?.count ?? 0,
      };
    }),

  // Create new content
  create: protectedProcedure
    .input(CreateContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Throttle publishing so the quick-compose path can't be scripted to
      // flood the feed (drafts are unmetered). 10 published posts / 5 min.
      if (input.published) {
        await enforceRateLimit({
          key: `create:${userId}`,
          limit: 10,
          windowMs: 5 * 60_000,
          message: "You're posting too fast. Take a breather and try again.",
        });
      }

      // Validate based on content type
      if (input.type === "POST" && !input.body) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Body is required for posts",
        });
      }

      if (
        (input.type === "LINK" || input.type === "VIDEO") &&
        !input.externalUrl
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "External URL is required for links and videos",
        });
      }

      const slug = generateSlug(input.title);
      const readingTime = calculateReadTime(input.body);
      const dbType = toDbType(input.type);

      // Auto-moderation gate (DEFAULT OFF). When MODERATION_ENABLED is "true"
      // and this create would go live directly, route it to `in_review` instead
      // of `published` so a client can't self-publish around review. Mirrors the
      // publish mutation's gate. When the flag is off, behaviour is unchanged.
      const moderated = input.published && isModerationEnabled();
      if (moderated) {
        screenContent({ title: input.title, body: input.body });
      }
      const dbStatus = moderated
        ? "in_review"
        : input.published
          ? "published"
          : "draft";

      const [newContent] = await ctx.db
        .insert(posts)
        .values({
          type: dbType,
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          externalUrl: input.externalUrl,
          coverImage: input.imageUrl || input.coverImage,
          canonicalUrl: input.canonicalUrl,
          authorId: userId,
          slug,
          readingTime,
          status: dbStatus,
          // No publishedAt while in review — admin approval sets it.
          publishedAt:
            input.published && !moderated ? new Date().toISOString() : null,
          showComments: input.showComments ?? true,
        })
        .returning();

      // Notify the admin there's something to review (fire-and-forget).
      if (newContent && moderated) {
        void notifyAdminOfReview({
          postId: newContent.id,
          title: input.title,
          authorName: ctx.session.user.name,
        });
      }

      // Add tags if provided
      if (input.tags && input.tags.length > 0) {
        for (const tagName of input.tags) {
          const existingTags = await ctx.db
            .select({ id: dbTag.id })
            .from(dbTag)
            .where(eq(dbTag.title, tagName.toLowerCase()))
            .limit(1);

          let tagId: number;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            const title = tagName.toLowerCase();
            // Always set a slug — null slugs break tag links + React keys.
            const tagSlug =
              title
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || title;
            const [newTag] = await ctx.db
              .insert(dbTag)
              .values({ title, slug: tagSlug })
              .returning();
            tagId = newTag.id;
          }

          await ctx.db
            .insert(post_tags)
            .values({ postId: newContent.id, tagId })
            .onConflictDoNothing();
        }
      }

      // Engagement: award points + check badges when a post goes live directly
      // (the quick-compose Discussion/Link path). Skipped under moderation —
      // the admin-approval path awards on publish. Never throws.
      if (newContent && input.published && !moderated) {
        await award({
          userId,
          action: "post_published",
          sourceType: "post",
          sourceId: newContent.id,
        });
      }

      return newContent;
    }),

  // Update content
  update: protectedProcedure
    .input(UpdateContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check ownership
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
          message: "Content not found",
        });
      }

      if (existing[0].authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own content",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.body !== undefined) {
        updateData.body = input.body;
        updateData.readingTime = calculateReadTime(input.body);
      }
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.externalUrl !== undefined)
        updateData.externalUrl = input.externalUrl;
      if (input.imageUrl !== undefined) updateData.coverImage = input.imageUrl;
      if (input.coverImage !== undefined)
        updateData.coverImage = input.coverImage;
      if (input.canonicalUrl !== undefined)
        updateData.canonicalUrl = input.canonicalUrl;
      if (input.showComments !== undefined)
        updateData.showComments = input.showComments;

      // Auto-moderation gate (DEFAULT OFF). A draft→live transition via update
      // must go through review too, otherwise a client could self-publish by
      // setting published:true here instead of calling publish. Mirrors the
      // publish mutation's gate.
      const goingLive =
        input.published === true && existing[0].status !== "published";
      const moderated = goingLive && isModerationEnabled();
      if (input.published !== undefined) {
        if (moderated) {
          screenContent({
            title: input.title ?? existing[0].title,
            body: input.body ?? existing[0].body,
          });
          updateData.status = "in_review";
          // No publishedAt while in review — admin approval sets it.
        } else {
          updateData.status = input.published ? "published" : "draft";
          if (input.published) {
            updateData.publishedAt = new Date().toISOString();
          }
        }
      }

      const [updated] = await ctx.db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, input.id))
        .returning();

      // Notify the admin there's something to review (fire-and-forget).
      if (updated && moderated) {
        void notifyAdminOfReview({
          postId: input.id,
          title: input.title ?? existing[0].title,
          authorName: ctx.session.user.name,
        });
      }

      // Update tags if provided
      if (input.tags !== undefined) {
        await ctx.db.delete(post_tags).where(eq(post_tags.postId, input.id));

        for (const tagName of input.tags) {
          const existingTags = await ctx.db
            .select({ id: dbTag.id })
            .from(dbTag)
            .where(eq(dbTag.title, tagName.toLowerCase()))
            .limit(1);

          let tagId: number;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            const title = tagName.toLowerCase();
            // Always set a slug — null slugs break tag links + React keys.
            const tagSlug =
              title
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || title;
            const [newTag] = await ctx.db
              .insert(dbTag)
              .values({ title, slug: tagSlug })
              .returning();
            tagId = newTag.id;
          }

          await ctx.db
            .insert(post_tags)
            .values({ postId: input.id, tagId })
            .onConflictDoNothing();
        }
      }

      return updated;
    }),

  // Delete content
  delete: protectedProcedure
    .input(DeleteContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check ownership
      const existing = await ctx.db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (existing[0].authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own content",
        });
      }

      await ctx.db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    }),

  // Vote on content
  vote: protectedProcedure
    .input(VoteContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { contentId, voteType } = input;

      // Check if content exists
      const contentItem = await ctx.db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
        })
        .from(posts)
        .where(eq(posts.id, contentId))
        .limit(1);

      if (contentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      // Get existing vote
      const existingVote = await ctx.db
        .select({ id: post_votes.id, voteType: post_votes.voteType })
        .from(post_votes)
        .where(
          and(eq(post_votes.postId, contentId), eq(post_votes.userId, userId)),
        )
        .limit(1);

      // Whether this voter previously had an "up" vote that is now going away
      // (removed entirely, or switched to "down"). Used to revoke the author's
      // upvote_received points so a ring can't upvote→unvote to inflate.
      const revokingUpvote =
        existingVote.length > 0 &&
        existingVote[0].voteType === "up" &&
        voteType !== "up";

      // Database triggers handle vote count updates automatically (tr_post_vote_counts)
      if (voteType === null) {
        // Remove vote
        if (existingVote.length > 0) {
          await ctx.db
            .delete(post_votes)
            .where(eq(post_votes.id, existingVote[0].id));
        }
      } else if (existingVote.length === 0) {
        // New vote
        await ctx.db.insert(post_votes).values({
          postId: contentId,
          userId,
          voteType: voteType as "up" | "down",
        });
      } else if (existingVote[0].voteType !== voteType) {
        // Change vote
        await ctx.db
          .update(post_votes)
          .set({ voteType: voteType as "up" | "down" })
          .where(eq(post_votes.id, existingVote[0].id));
      }

      // Revoke the author's awarded point when an upvote is removed/downgraded,
      // matching the exact (action, sourceId, actorId) tuple awarded below.
      // Without this an upvote→unvote loop permanently inflates the author.
      if (revokingUpvote) {
        await ctx.db
          .delete(point_event)
          .where(
            and(
              eq(point_event.action, "upvote_received"),
              eq(point_event.sourceId, contentId),
              eq(point_event.actorId, userId),
            ),
          );
      }

      // Award the author points for an upvote (idempotent per voter+post via
      // the dedupe index; never self-award). Fire-and-forget — never throws.
      if (
        voteType === "up" &&
        contentItem[0].authorId &&
        contentItem[0].authorId !== userId
      ) {
        await award({
          userId: contentItem[0].authorId,
          action: "upvote_received",
          sourceType: "post",
          sourceId: contentId,
          actorId: userId,
        });
      }

      return { success: true };
    }),

  // Bookmark content
  bookmark: protectedProcedure
    .input(BookmarkContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { contentId, setBookmarked } = input;

      // Check if content exists
      const contentItem = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, contentId))
        .limit(1);

      if (contentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(bookmarks)
          .values({ postId: contentId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(bookmarks)
          .where(
            and(eq(bookmarks.postId, contentId), eq(bookmarks.userId, userId)),
          );
      }

      return { success: true };
    }),

  // Track click on external content
  trackClick: publicProcedure
    .input(TrackClickContentSchema)
    .mutation(async ({ ctx, input }) => {
      // This endpoint is unauthenticated and bumps a counter that feeds
      // trending/popular sort, so throttle per client+content to stop a script
      // inflating any post's view count, and only count published posts.
      const identifier =
        ctx.session?.user?.id ?? `ip:${clientIpFromHeaders(ctx.headers)}`;
      await enforceRateLimit({
        key: `trackClick:${identifier}:${input.contentId}`,
        limit: 10,
        windowMs: 60_000,
      });

      await ctx.db
        .update(posts)
        .set({ viewsCount: increment(posts.viewsCount) })
        .where(
          and(eq(posts.id, input.contentId), eq(posts.status, "published")),
        );

      return { success: true };
    }),

  // Get user's content
  getUserContent: publicProcedure
    .input(GetUserContentSchema)
    .query(async ({ ctx, input }) => {
      const { userId: targetUserId, type, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      const conditions = [eq(posts.authorId, targetUserId)];

      // Only show published content unless viewing own profile
      if (currentUserId !== targetUserId) {
        conditions.push(eq(posts.status, "published"));
      }

      if (type) {
        const dbType = toDbType(type);
        conditions.push(eq(posts.type, dbType));
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
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          published: sql<boolean>`${posts.status} = 'published'`,
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

      // Map types from DB format to frontend format
      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

  // Get saved content for current user
  mySavedContent: protectedProcedure
    .input(GetSavedContentSchema)
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
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          authorName: user.name,
          authorUsername: user.username,
          bookmarkedAt: bookmarks.createdAt,
        })
        .from(bookmarks)
        .innerJoin(posts, eq(bookmarks.postId, posts.id))
        .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
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

      // Map types from DB format to frontend format
      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

  // Get categories (from sources)
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .selectDistinct({ category: feed_sources.category })
      .from(feed_sources)
      .where(isNotNull(feed_sources.category));

    return results
      .map((r) => r.category)
      .filter((c): c is string => c !== null)
      .sort();
  }),

  // Get content types count
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

  // Edit Draft - get user's own content by ID for editing
  editDraft: protectedProcedure
    .input(EditDraftContentSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          imageUrl: posts.coverImage,
          canonicalUrl: posts.canonicalUrl,
          coverImage: posts.coverImage,
          slug: posts.slug,
          published: sql<boolean>`${posts.status} = 'published'`,
          publishedAt: posts.publishedAt,
          showComments: posts.showComments,
          readTimeMins: posts.readingTime,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(and(eq(posts.id, input.id), eq(posts.authorId, userId)))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found or you don't have permission to edit it",
        });
      }

      // Get tags for this content
      const contentTags = await ctx.db
        .select({
          tag: {
            id: dbTag.id,
            title: dbTag.title,
          },
        })
        .from(post_tags)
        .innerJoin(dbTag, eq(post_tags.tagId, dbTag.id))
        .where(eq(post_tags.postId, input.id));

      return {
        ...results[0],
        type: toFrontendType(results[0].type),
        tags: contentTags,
      };
    }),

  // My Drafts - get user's unpublished ARTICLE content
  myDrafts: protectedProcedure
    .input(MyDraftsContentSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          slug: posts.slug,
          status: posts.status,
          published: sql<boolean>`${posts.status} = 'published'`,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.authorId, userId),
            eq(posts.type, "article"),
            // Drafts plus auto-moderation states the author should still see.
            inArray(posts.status, ["draft", "in_review", "rejected"]),
          ),
        )
        .orderBy(desc(posts.updatedAt))
        .limit(input.limit);

      // Map types from DB format to frontend format
      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

  // My Published - get user's published ARTICLE content
  myPublished: protectedProcedure
    .input(MyPublishedContentSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date().toISOString();

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          slug: posts.slug,
          published: sql<boolean>`${posts.status} = 'published'`,
          publishedAt: posts.publishedAt,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.authorId, userId),
            eq(posts.type, "article"),
            eq(posts.status, "published"),
            lte(posts.publishedAt, now),
          ),
        )
        .orderBy(desc(posts.publishedAt))
        .limit(input.limit);

      // Map types from DB format to frontend format
      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

  // My Scheduled - get user's scheduled ARTICLE content
  myScheduled: protectedProcedure
    .input(MyScheduledContentSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          slug: posts.slug,
          published: sql<boolean>`${posts.status} = 'published'`,
          publishedAt: posts.publishedAt,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(
          and(
            eq(posts.authorId, userId),
            eq(posts.type, "article"),
            eq(posts.status, "scheduled"),
          ),
        )
        .orderBy(desc(posts.publishedAt))
        .limit(input.limit);

      // Map types from DB format to frontend format
      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

  // Publish - separate mutation to publish/unpublish content
  publish: protectedProcedure
    .input(PublishContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check ownership
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
          message: "Content not found",
        });
      }

      if (existing[0].authorId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only publish your own content",
        });
      }

      const updateData: Record<string, unknown> = {
        status: input.published ? "published" : "draft",
      };

      // Set publishedAt when publishing
      if (input.published) {
        // Throttle the same as create's published path — otherwise a user can
        // mass-create drafts then publish-loop to flood the feed. 10 / 5 min.
        await enforceRateLimit({
          key: `create:${userId}`,
          limit: 10,
          windowMs: 5 * 60_000,
          message: "You're posting too fast. Take a breather and try again.",
        });

        // Auto-moderation gate (DEFAULT OFF). When MODERATION_ENABLED is "true"
        // and the author is publishing a post for the first time (it was a
        // draft), route it to `in_review` instead of `published`: do NOT set
        // publishedAt yet (admin approval handles that). When the flag is off
        // this whole branch is skipped and behaviour is unchanged.
        if (isModerationEnabled() && existing[0].status === "draft") {
          // screenContent is advisory only — a failing screen still goes to
          // in_review so a human reviewer makes the final call.
          screenContent({
            title: existing[0].title,
            body: existing[0].body,
          });
          updateData.status = "in_review";
          // Generate the slug now so the post has a stable URL once approved.
          if (existing[0].title) {
            updateData.slug = generateSlug(existing[0].title);
          }

          const [reviewed] = await ctx.db
            .update(posts)
            .set(updateData)
            .where(eq(posts.id, input.id))
            .returning();

          // Notify the admin there's something to review (fire-and-forget).
          void notifyAdminOfReview({
            postId: input.id,
            title: existing[0].title,
            authorName: ctx.session.user.name,
          });

          return reviewed;
        }

        if (input.publishTime) {
          updateData.publishedAt = input.publishTime.toISOString();
        } else {
          updateData.publishedAt = new Date().toISOString();
        }

        // Generate new slug if this is the first time publishing
        if (existing[0].status === "draft" && existing[0].title) {
          updateData.slug = generateSlug(existing[0].title);
        }
      }

      const [updated] = await ctx.db
        .update(posts)
        .set(updateData)
        .where(eq(posts.id, input.id))
        .returning();

      // Award points the first time a post is published (draft → published;
      // the moderation path awards on admin approval instead). Never throws.
      if (input.published && existing[0].status === "draft") {
        await award({
          userId,
          action: "post_published",
          sourceType: "post",
          sourceId: input.id,
        });
      }

      return updated;
    }),

  // Get user-created link post by username and slug
  getUserLinkBySlug: publicProcedure
    .input(GetContentBySlugSchema.extend({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      // Find the user
      const userResult = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.username, input.username))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const authorId = userResult[0].id;

      // Find the link post
      const linkPostResults = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          coverImage: posts.coverImage,
          slug: posts.slug,
          publishedAt: posts.publishedAt,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          showComments: posts.showComments,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          // Author info
          authorId: user.id,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
          authorBio: user.bio,
        })
        .from(posts)
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(
          and(
            eq(posts.slug, input.slug),
            eq(posts.authorId, authorId),
            eq(posts.type, "link"),
            eq(posts.status, "published"),
            lte(posts.publishedAt, new Date().toISOString()),
          ),
        )
        .limit(1);

      if (linkPostResults.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link post not found",
        });
      }

      const linkPost = linkPostResults[0];

      // Get user vote if logged in
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: post_votes.voteType })
            .from(post_votes)
            .where(
              and(
                eq(post_votes.postId, linkPost.id),
                eq(post_votes.userId, userId),
              ),
            )
            .limit(1),
          ctx.db
            .select({ id: bookmarks.id })
            .from(bookmarks)
            .where(
              and(
                eq(bookmarks.postId, linkPost.id),
                eq(bookmarks.userId, userId),
              ),
            )
            .limit(1),
        ]);

        userVote = voteResult[0]?.voteType ?? null;
        isBookmarked = bookmarkResult.length > 0;
      }

      return {
        ...linkPost,
        type: toFrontendType(linkPost.type),
        userVote,
        isBookmarked,
        author: {
          id: linkPost.authorId,
          name: linkPost.authorName,
          username: linkPost.authorUsername,
          image: linkPost.authorImage,
          bio: linkPost.authorBio,
        },
      };
    }),
});
