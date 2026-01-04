import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../trpc";
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
} from "../../../schema/content";
import {
  content,
  content_vote,
  content_bookmark,
  content_tag,
  feed_source,
  tag,
  user,
  discussion,
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
  inArray,
} from "drizzle-orm";
import { increment, decrement } from "./utils";
import { db } from "@/server/db";
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

export const contentRouter = createTRPCRouter({
  // Get unified feed with optional type filtering
  getFeed: publicProcedure
    .input(GetUnifiedFeedSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 20;
      const { cursor, sort, type, category, sourceId } = input;

      // Build the vote subquery for current user
      const userVotes = userId
        ? ctx.db
            .select({
              contentId: content_vote.contentId,
              voteType: content_vote.voteType,
            })
            .from(content_vote)
            .where(eq(content_vote.userId, userId))
            .as("userVotes")
        : null;

      // Build the bookmark subquery for current user
      const userBookmarks = userId
        ? ctx.db
            .select({
              contentId: content_bookmark.contentId,
            })
            .from(content_bookmark)
            .where(eq(content_bookmark.userId, userId))
            .as("userBookmarks")
        : null;

      // Calculate score for trending
      const scoreExpr = sql<number>`(${content.upvotes} - ${content.downvotes})`;

      // Build conditions
      const conditions = [eq(content.published, true)];

      if (type) {
        conditions.push(eq(content.type, type));
      }

      if (sourceId) {
        conditions.push(eq(content.sourceId, sourceId));
      }

      // Build order by and cursor conditions based on sort type
      const getOrderAndCursor = () => {
        switch (sort) {
          case "recent":
            return {
              orderBy: desc(content.publishedAt),
              cursorCondition: cursor?.publishedAt
                ? lte(content.publishedAt, cursor.publishedAt)
                : undefined,
            };
          case "trending":
            return {
              orderBy: desc(scoreExpr),
              cursorCondition: cursor?.score !== undefined
                ? lt(scoreExpr, cursor.score)
                : undefined,
            };
          case "popular":
            return {
              orderBy: desc(content.upvotes),
              cursorCondition: cursor?.score !== undefined
                ? lt(content.upvotes, cursor.score)
                : undefined,
            };
          default:
            return {
              orderBy: desc(content.publishedAt),
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
            id: content.id,
            type: content.type,
            title: content.title,
            excerpt: content.excerpt,
            body: content.body,
            externalUrl: content.externalUrl,
            imageUrl: content.imageUrl,
            ogImageUrl: content.ogImageUrl,
            slug: content.slug,
            publishedAt: content.publishedAt,
            upvotes: content.upvotes,
            downvotes: content.downvotes,
            clickCount: content.clickCount,
            readTimeMins: content.readTimeMins,
            userId: content.userId,
            sourceId: content.sourceId,
            sourceAuthor: content.sourceAuthor,
            createdAt: content.createdAt,
            // Source info
            sourceName: feed_source.name,
            sourceSlug: feed_source.slug,
            sourceLogo: feed_source.logoUrl,
            sourceWebsite: feed_source.websiteUrl,
            sourceCategory: feed_source.category,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User-specific
            userVote: userVotes.voteType,
            isBookmarked: sql<boolean>`${userBookmarks.contentId} IS NOT NULL`,
          })
          .from(content)
          .leftJoin(feed_source, eq(content.sourceId, feed_source.id))
          .leftJoin(user, eq(content.userId, user.id))
          .leftJoin(userVotes, eq(content.id, userVotes.contentId))
          .leftJoin(userBookmarks, eq(content.id, userBookmarks.contentId))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1);
      } else {
        query = ctx.db
          .select({
            id: content.id,
            type: content.type,
            title: content.title,
            excerpt: content.excerpt,
            body: content.body,
            externalUrl: content.externalUrl,
            imageUrl: content.imageUrl,
            ogImageUrl: content.ogImageUrl,
            slug: content.slug,
            publishedAt: content.publishedAt,
            upvotes: content.upvotes,
            downvotes: content.downvotes,
            clickCount: content.clickCount,
            readTimeMins: content.readTimeMins,
            userId: content.userId,
            sourceId: content.sourceId,
            sourceAuthor: content.sourceAuthor,
            createdAt: content.createdAt,
            // Source info
            sourceName: feed_source.name,
            sourceSlug: feed_source.slug,
            sourceLogo: feed_source.logoUrl,
            sourceWebsite: feed_source.websiteUrl,
            sourceCategory: feed_source.category,
            // Author info
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
            // User-specific (null when not logged in)
            userVote: sql<"UP" | "DOWN" | null>`NULL`,
            isBookmarked: sql<boolean>`FALSE`,
          })
          .from(content)
          .leftJoin(feed_source, eq(content.sourceId, feed_source.id))
          .leftJoin(user, eq(content.userId, user.id))
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit + 1);
      }

      const results = await query;

      // Check if there's a next page
      let nextCursor: { id: string; publishedAt?: string; score?: number } | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        const score = lastItem.upvotes - lastItem.downvotes;
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

  // Get content by ID
  getById: publicProcedure
    .input(GetContentByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const results = await ctx.db
        .select({
          id: content.id,
          type: content.type,
          title: content.title,
          body: content.body,
          excerpt: content.excerpt,
          externalUrl: content.externalUrl,
          imageUrl: content.imageUrl,
          ogImageUrl: content.ogImageUrl,
          slug: content.slug,
          canonicalUrl: content.canonicalUrl,
          coverImage: content.coverImage,
          publishedAt: content.publishedAt,
          upvotes: content.upvotes,
          downvotes: content.downvotes,
          clickCount: content.clickCount,
          readTimeMins: content.readTimeMins,
          showComments: content.showComments,
          userId: content.userId,
          sourceId: content.sourceId,
          sourceAuthor: content.sourceAuthor,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          // Source info
          sourceName: feed_source.name,
          sourceSlug: feed_source.slug,
          sourceLogo: feed_source.logoUrl,
          sourceWebsite: feed_source.websiteUrl,
          sourceCategory: feed_source.category,
          // Author info
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
        })
        .from(content)
        .leftJoin(feed_source, eq(content.sourceId, feed_source.id))
        .leftJoin(user, eq(content.userId, user.id))
        .where(eq(content.id, input.id))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      const item = results[0];

      // Get user vote if logged in
      let userVote: "UP" | "DOWN" | null = null;
      let isBookmarked = false;

      if (userId) {
        const [voteResult, bookmarkResult] = await Promise.all([
          ctx.db
            .select({ voteType: content_vote.voteType })
            .from(content_vote)
            .where(
              and(
                eq(content_vote.contentId, input.id),
                eq(content_vote.userId, userId)
              )
            )
            .limit(1),
          ctx.db
            .select({ id: content_bookmark.id })
            .from(content_bookmark)
            .where(
              and(
                eq(content_bookmark.contentId, input.id),
                eq(content_bookmark.userId, userId)
              )
            )
            .limit(1),
        ]);

        userVote = voteResult[0]?.voteType ?? null;
        isBookmarked = bookmarkResult.length > 0;
      }

      // Get discussion count
      const discussionCountResult = await ctx.db
        .select({ count: count() })
        .from(discussion)
        .where(eq(discussion.contentId, input.id));

      return {
        ...item,
        userVote,
        isBookmarked,
        discussionCount: discussionCountResult[0]?.count ?? 0,
      };
    }),

  // Get content by slug
  getBySlug: publicProcedure
    .input(GetContentBySlugSchema)
    .query(async ({ ctx, input }) => {
      const results = await ctx.db
        .select({ id: content.id })
        .from(content)
        .where(eq(content.slug, input.slug))
        .limit(1);

      if (results.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      // Reuse getById logic
      return ctx.db.query.content.findFirst({
        where: eq(content.slug, input.slug),
      });
    }),

  // Create new content
  create: protectedProcedure
    .input(CreateContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate based on content type
      if (input.type === "ARTICLE" && !input.body) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Body is required for articles",
        });
      }

      if ((input.type === "LINK" || input.type === "VIDEO") && !input.externalUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "External URL is required for links and videos",
        });
      }

      const slug = generateSlug(input.title);
      const readTimeMins = calculateReadTime(input.body);

      const [newContent] = await ctx.db
        .insert(content)
        .values({
          type: input.type,
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          externalUrl: input.externalUrl,
          imageUrl: input.imageUrl,
          coverImage: input.coverImage,
          canonicalUrl: input.canonicalUrl,
          userId,
          slug,
          readTimeMins,
          published: input.published,
          publishedAt: input.published ? new Date().toISOString() : null,
          showComments: input.showComments,
        })
        .returning();

      // Add tags if provided
      if (input.tags && input.tags.length > 0) {
        // Get or create tags
        for (const tagName of input.tags) {
          // Try to find existing tag
          const existingTags = await ctx.db
            .select({ id: tag.id })
            .from(tag)
            .where(eq(tag.title, tagName.toLowerCase()))
            .limit(1);

          let tagId: number;
          if (existingTags.length > 0) {
            tagId = existingTags[0].id;
          } else {
            // Create new tag
            const [newTag] = await ctx.db
              .insert(tag)
              .values({ title: tagName.toLowerCase() })
              .returning();
            tagId = newTag.id;
          }

          // Link tag to content
          await ctx.db
            .insert(content_tag)
            .values({ contentId: newContent.id, tagId })
            .onConflictDoNothing();
        }
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
        .select({ userId: content.userId, type: content.type })
        .from(content)
        .where(eq(content.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (existing[0].userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own content",
        });
      }

      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.body !== undefined) {
        updateData.body = input.body;
        updateData.readTimeMins = calculateReadTime(input.body);
      }
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.externalUrl !== undefined) updateData.externalUrl = input.externalUrl;
      if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
      if (input.coverImage !== undefined) updateData.coverImage = input.coverImage;
      if (input.canonicalUrl !== undefined) updateData.canonicalUrl = input.canonicalUrl;
      if (input.showComments !== undefined) updateData.showComments = input.showComments;
      if (input.published !== undefined) {
        updateData.published = input.published;
        if (input.published) {
          updateData.publishedAt = new Date().toISOString();
        }
      }

      const [updated] = await ctx.db
        .update(content)
        .set(updateData)
        .where(eq(content.id, input.id))
        .returning();

      // Update tags if provided
      if (input.tags !== undefined) {
        // Remove existing tags
        await ctx.db
          .delete(content_tag)
          .where(eq(content_tag.contentId, input.id));

        // Add new tags
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
            .insert(content_tag)
            .values({ contentId: input.id, tagId })
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
        .select({ userId: content.userId })
        .from(content)
        .where(eq(content.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (existing[0].userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own content",
        });
      }

      await ctx.db.delete(content).where(eq(content.id, input.id));

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
        .select({ id: content.id, upvotes: content.upvotes, downvotes: content.downvotes })
        .from(content)
        .where(eq(content.id, contentId))
        .limit(1);

      if (contentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      // Get existing vote
      const existingVote = await ctx.db
        .select({ id: content_vote.id, voteType: content_vote.voteType })
        .from(content_vote)
        .where(
          and(
            eq(content_vote.contentId, contentId),
            eq(content_vote.userId, userId)
          )
        )
        .limit(1);

      if (voteType === null) {
        // Remove vote
        if (existingVote.length > 0) {
          const oldVoteType = existingVote[0].voteType;
          await ctx.db
            .delete(content_vote)
            .where(eq(content_vote.id, existingVote[0].id));

          // Update vote counts
          if (oldVoteType === "UP") {
            await ctx.db
              .update(content)
              .set({ upvotes: decrement(content.upvotes) })
              .where(eq(content.id, contentId));
          } else {
            await ctx.db
              .update(content)
              .set({ downvotes: decrement(content.downvotes) })
              .where(eq(content.id, contentId));
          }
        }
      } else if (existingVote.length === 0) {
        // New vote
        await ctx.db.insert(content_vote).values({
          contentId,
          userId,
          voteType,
        });

        // Update vote counts
        if (voteType === "UP") {
          await ctx.db
            .update(content)
            .set({ upvotes: increment(content.upvotes) })
            .where(eq(content.id, contentId));
        } else {
          await ctx.db
            .update(content)
            .set({ downvotes: increment(content.downvotes) })
            .where(eq(content.id, contentId));
        }
      } else if (existingVote[0].voteType !== voteType) {
        // Change vote
        await ctx.db
          .update(content_vote)
          .set({ voteType })
          .where(eq(content_vote.id, existingVote[0].id));

        // Update vote counts (flip both)
        if (voteType === "UP") {
          await ctx.db
            .update(content)
            .set({
              upvotes: increment(content.upvotes),
              downvotes: decrement(content.downvotes),
            })
            .where(eq(content.id, contentId));
        } else {
          await ctx.db
            .update(content)
            .set({
              upvotes: decrement(content.upvotes),
              downvotes: increment(content.downvotes),
            })
            .where(eq(content.id, contentId));
        }
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
        .select({ id: content.id })
        .from(content)
        .where(eq(content.id, contentId))
        .limit(1);

      if (contentItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Content not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(content_bookmark)
          .values({ contentId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(content_bookmark)
          .where(
            and(
              eq(content_bookmark.contentId, contentId),
              eq(content_bookmark.userId, userId)
            )
          );
      }

      return { success: true };
    }),

  // Track click on external content
  trackClick: publicProcedure
    .input(TrackClickContentSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(content)
        .set({ clickCount: increment(content.clickCount) })
        .where(eq(content.id, input.contentId));

      return { success: true };
    }),

  // Get user's content
  getUserContent: publicProcedure
    .input(GetUserContentSchema)
    .query(async ({ ctx, input }) => {
      const { userId: targetUserId, type, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      const conditions = [eq(content.userId, targetUserId)];

      // Only show published content unless viewing own profile
      if (currentUserId !== targetUserId) {
        conditions.push(eq(content.published, true));
      }

      if (type) {
        conditions.push(eq(content.type, type));
      }

      if (cursor?.publishedAt) {
        conditions.push(lte(content.publishedAt, cursor.publishedAt));
      }

      const results = await ctx.db
        .select({
          id: content.id,
          type: content.type,
          title: content.title,
          excerpt: content.excerpt,
          slug: content.slug,
          publishedAt: content.publishedAt,
          upvotes: content.upvotes,
          downvotes: content.downvotes,
          published: content.published,
          createdAt: content.createdAt,
        })
        .from(content)
        .where(and(...conditions))
        .orderBy(desc(content.publishedAt))
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

  // Get saved content for current user
  mySavedContent: protectedProcedure
    .input(GetSavedContentSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { limit, cursor } = input;

      const conditions = [eq(content_bookmark.userId, userId)];

      if (cursor?.createdAt) {
        conditions.push(lte(content_bookmark.createdAt, cursor.createdAt));
      }

      const results = await ctx.db
        .select({
          id: content.id,
          type: content.type,
          title: content.title,
          excerpt: content.excerpt,
          externalUrl: content.externalUrl,
          slug: content.slug,
          publishedAt: content.publishedAt,
          upvotes: content.upvotes,
          downvotes: content.downvotes,
          sourceName: feed_source.name,
          sourceSlug: feed_source.slug,
          authorName: user.name,
          authorUsername: user.username,
          bookmarkedAt: content_bookmark.createdAt,
        })
        .from(content_bookmark)
        .innerJoin(content, eq(content_bookmark.contentId, content.id))
        .leftJoin(feed_source, eq(content.sourceId, feed_source.id))
        .leftJoin(user, eq(content.userId, user.id))
        .where(and(...conditions))
        .orderBy(desc(content_bookmark.createdAt))
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

  // Get categories (from sources)
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .selectDistinct({ category: feed_source.category })
      .from(feed_source)
      .where(isNotNull(feed_source.category));

    return results
      .map((r) => r.category)
      .filter((c): c is string => c !== null)
      .sort();
  }),

  // Get content types count
  getTypeCounts: publicProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select({
        type: content.type,
        count: count(),
      })
      .from(content)
      .where(eq(content.published, true))
      .groupBy(content.type);

    return results;
  }),
});
