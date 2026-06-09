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
import { applyGate, notifyAdminOfReview } from "@/server/lib/moderation";
import { runDedupeAndGate } from "@/server/lib/dedupe";
import { enforceRateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";
import { award } from "@/server/lib/engagement";
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

type DbPostType =
  | "article"
  | "discussion"
  | "link"
  | "resource"
  | "til"
  | "question";

function toDbType(frontendType: string): DbPostType {
  const typeMap: Record<string, DbPostType> = {
    POST: "article",
    ARTICLE: "article",
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
  getFeed: publicProcedure
    .input(GetUnifiedFeedSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 25;
      const { cursor, sort, type, kinds, sourceId, category, tag, following } =
        input;

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

      const userBookmarks = userId
        ? ctx.db
            .select({
              postId: bookmarks.postId,
            })
            .from(bookmarks)
            .where(eq(bookmarks.userId, userId))
            .as("userBookmarks")
        : null;

      const scoreExpr = sql<number>`(${posts.upvotesCount} - ${posts.downvotesCount})`;

      const conditions = [eq(posts.status, "published")];

      if (type) {
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

      if (category) {
        conditions.push(eq(feed_sources.category, category));
      }

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
            sourceName: feed_sources.name,
            sourceSlug: feed_sources.slug,
            sourceLogo: feed_sources.logoUrl,
            sourceWebsite: feed_sources.websiteUrl,
            sourceCategory: feed_sources.category,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
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
            sourceName: feed_sources.name,
            sourceSlug: feed_sources.slug,
            sourceLogo: feed_sources.logoUrl,
            sourceWebsite: feed_sources.websiteUrl,
            sourceCategory: feed_sources.category,
            authorName: user.name,
            authorUsername: user.username,
            authorImage: user.image,
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

      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

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
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
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
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
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

      // Going-live gate (dedupe + moderation). Only runs on a direct go-live so
      // a client can't self-publish around review; drafts stay drafts. May throw
      // CONFLICT for a hard duplicate (propagates to the client). When not going
      // live there's no gate result and the row is a plain draft.
      const gate = input.published
        ? await runDedupeAndGate({
            type: dbType,
            title: input.title,
            body: input.body,
            externalUrl: input.externalUrl,
          })
        : null;
      const dbStatus = gate ? gate.status : "draft";

      // Create writes the gate fields inline (typed insert) rather than via
      // applyGate; gate may be null on the draft path, and the `gate?.X ?? null`
      // form already keeps all four fields in sync, so there's no drift to fix.
      const [newContent] = await ctx.db
        .insert(posts)
        .values({
          type: dbType,
          title: input.title,
          body: input.body,
          excerpt: input.excerpt,
          externalUrl: input.externalUrl,
          externalUrlNormalized: gate?.externalUrlNormalized ?? null,
          coverImage: input.imageUrl || input.coverImage,
          canonicalUrl: input.canonicalUrl,
          authorId: userId,
          slug,
          readingTime,
          status: dbStatus,
          moderationNote: gate?.moderationNote ?? null,
          // No publishedAt while in review — admin approval sets it.
          publishedAt: gate?.publishedAt ?? null,
          showComments: input.showComments ?? true,
        })
        .returning();

      // Notify the admin there's something to review (fire-and-forget).
      if (newContent && gate?.status === "in_review") {
        void notifyAdminOfReview({
          postId: newContent.id,
          title: input.title,
          authorName: ctx.session.user.name,
        });
      }

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

      // Award points when a post goes live directly; skipped when routed to
      // review (the admin-approval path awards on publish instead). Never throws.
      if (newContent && gate?.status === "published") {
        await award({
          userId,
          action: "post_published",
          sourceType: "post",
          sourceId: newContent.id,
        });
      }

      return newContent;
    }),

  update: protectedProcedure
    .input(UpdateContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select({
          authorId: posts.authorId,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          externalUrl: posts.externalUrl,
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

      // Going-live gate (dedupe + moderation): a draft→live transition via
      // update must go through review too, else a client self-publishes by
      // setting published:true here instead of calling publish. Gate input is
      // completed from the existing row (title/body/externalUrl), since update
      // input may omit them. May throw CONFLICT for a hard duplicate.
      // Update handlers gate on `!== "published"` (so a scheduled→published flip
      // via update IS re-gated); publish handlers gate on `=== "draft"` only. The
      // asymmetry is intentional and mirrors pre-existing behaviour.
      const goingLive =
        input.published === true && existing[0].status !== "published";
      let gate: Awaited<ReturnType<typeof runDedupeAndGate>> | null = null;
      if (input.published !== undefined) {
        if (goingLive) {
          gate = await runDedupeAndGate({
            type: existing[0].type,
            title: input.title ?? existing[0].title,
            body: input.body ?? existing[0].body,
            externalUrl:
              input.externalUrl !== undefined
                ? input.externalUrl
                : existing[0].externalUrl,
          });
          // Writes all four gate fields. publishedAt is the gate's now when
          // published, null while in review (admin approval sets it). This
          // handler has no publishTime scheduling, so no override is needed.
          applyGate(updateData, gate);
        } else {
          // Not going live (e.g. unpublish, or already published) — preserve the
          // previous straightforward status flip with no gating.
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
      if (updated && gate?.status === "in_review") {
        void notifyAdminOfReview({
          postId: input.id,
          title: input.title ?? existing[0].title,
          authorName: ctx.session.user.name,
        });
      }

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

  delete: protectedProcedure
    .input(DeleteContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

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

  vote: protectedProcedure
    .input(VoteContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { contentId, voteType } = input;

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
        if (existingVote.length > 0) {
          await ctx.db
            .delete(post_votes)
            .where(eq(post_votes.id, existingVote[0].id));
        }
      } else if (existingVote.length === 0) {
        await ctx.db.insert(post_votes).values({
          postId: contentId,
          userId,
          voteType: voteType as "up" | "down",
        });
      } else if (existingVote[0].voteType !== voteType) {
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

  bookmark: protectedProcedure
    .input(BookmarkContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { contentId, setBookmarked } = input;

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

      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

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

      const mappedItems = results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));

      return {
        items: mappedItems,
        nextCursor,
      };
    }),

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

      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

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

      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

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

      return results.map((item) => ({
        ...item,
        type: toFrontendType(item.type),
      }));
    }),

  publish: protectedProcedure
    .input(PublishContentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          type: posts.type,
          title: posts.title,
          body: posts.body,
          externalUrl: posts.externalUrl,
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

      // Whether this publish is a first-time go-live (draft → live), which is
      // what the gate guards. Republishing an already-published post isn't gated.
      // Note the asymmetry vs update: publish gates on `=== "draft"` only, so a
      // scheduled→published promotion via publish is intentionally NOT re-gated
      // (mirrors pre-existing behaviour); update gates on `!== "published"`.
      const goingLive = input.published && existing[0].status === "draft";
      let gate: Awaited<ReturnType<typeof runDedupeAndGate>> | null = null;

      if (input.published) {
        // Throttle the same as create's published path — otherwise a user can
        // mass-create drafts then publish-loop to flood the feed. 10 / 5 min.
        await enforceRateLimit({
          key: `create:${userId}`,
          limit: 10,
          windowMs: 5 * 60_000,
          message: "You're posting too fast. Take a breather and try again.",
        });

        if (goingLive) {
          // Dedupe + moderation gate. May throw CONFLICT for a hard duplicate.
          gate = await runDedupeAndGate({
            type: existing[0].type,
            title: existing[0].title ?? "",
            body: existing[0].body,
            externalUrl: existing[0].externalUrl,
          });
          // Writes all four gate fields. On the published path publishedAt is
          // overwritten below to honour an explicit publishTime; on in_review it
          // stays null (admin approval sets it).
          applyGate(updateData, gate);
          // Generate the slug now so the post has a stable URL once live/approved.
          if (existing[0].title) {
            updateData.slug = generateSlug(existing[0].title);
          }

          if (gate.status === "in_review") {
            // No publishedAt while in review — admin approval sets it.
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
          // gate says published — fall through to the publishedAt logic below,
          // honouring any explicit publishTime scheduling.
        }

        if (input.publishTime) {
          updateData.publishedAt = input.publishTime.toISOString();
        } else {
          updateData.publishedAt = new Date().toISOString();
        }

        // Regenerate the slug on first publish (draft → published) when the gate
        // path above didn't already set it.
        if (
          !goingLive &&
          existing[0].status === "draft" &&
          existing[0].title
        ) {
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

  getUserLinkBySlug: publicProcedure
    .input(GetContentBySlugSchema.extend({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

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
