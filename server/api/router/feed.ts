import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminOnlyProcedure,
} from "../trpc";
import {
  GetFeedSchema,
  VoteArticleSchema,
  BookmarkArticleSchema,
  TrackClickSchema,
  CreateFeedSourceSchema,
  UpdateFeedSourceSchema,
  GetSourcesSchema,
  DeleteFeedSourceSchema,
  GetArticleByIdSchema,
  GetArticleBySlugSchema,
  GetArticleBySlugAndShortIdSchema,
  GetSourceBySlugSchema,
  GetArticlesBySourceSchema,
  GetArticleBySourceAndArticleSlugSchema,
  GetLinkContentBySourceAndSlugSchema,
} from "../../../schema/feed";
import {
  posts,
  post_votes,
  bookmarks,
  feed_sources,
  tag,
  post_tags,
  user,
} from "@/server/db/schema";
import {
  and,
  eq,
  desc,
  asc,
  lte,
  lt,
  sql,
  isNotNull,
  count,
} from "drizzle-orm";
import { increment, decrement } from "./utils";
import { db } from "@/server/db";

export const feedRouter = createTRPCRouter({
  // Get feed of link posts (external/RSS content)
  getFeed: publicProcedure.input(GetFeedSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const limit = input?.limit ?? 20;
    const { cursor, sort, category } = input;

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

    // Build order by and cursor conditions based on sort type
    const getOrderAndCursor = () => {
      switch (sort) {
        case "recent":
          return {
            orderBy: desc(posts.publishedAt),
            cursorCondition: cursor
              ? lte(posts.publishedAt, cursor.publishedAt as string)
              : undefined,
          };
        case "trending":
          // Trending: recent articles with high engagement
          return {
            orderBy: desc(scoreExpr),
            cursorCondition: cursor
              ? lt(scoreExpr, cursor.score as number)
              : undefined,
          };
        case "popular":
          return {
            orderBy: desc(posts.upvotesCount),
            cursorCondition: cursor
              ? lt(posts.upvotesCount, cursor.score as number)
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

    // Base query for link posts (external content)
    let query = ctx.db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        url: posts.externalUrl,
        imageUrl: posts.coverImage,
        author: posts.sourceAuthor,
        publishedAt: posts.publishedAt,
        upvotes: posts.upvotesCount,
        downvotes: posts.downvotesCount,
        viewsCount: posts.viewsCount,
        sourceName: feed_sources.name,
        sourceSlug: feed_sources.slug,
        sourceLogo: feed_sources.logoUrl,
        sourceWebsite: feed_sources.websiteUrl,
        sourceCategory: feed_sources.category,
        userVote: userVotes ? userVotes.voteType : sql<string | null>`NULL`,
        isBookmarked: userBookmarks
          ? sql<boolean>`CASE WHEN ${userBookmarks.postId} IS NOT NULL THEN TRUE ELSE FALSE END`
          : sql<boolean>`FALSE`,
      })
      .from(posts)
      .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id));

    // Add user joins if logged in
    if (userVotes) {
      query = query.leftJoin(
        userVotes,
        eq(posts.id, userVotes.postId),
      ) as typeof query;
    }
    if (userBookmarks) {
      query = query.leftJoin(
        userBookmarks,
        eq(posts.id, userBookmarks.postId),
      ) as typeof query;
    }

    // Build where conditions - only link type posts with sources
    const whereConditions = [
      eq(posts.type, "link"),
      eq(posts.status, "published"),
      isNotNull(posts.sourceId),
      category ? eq(feed_sources.category, category) : undefined,
      cursorCondition,
    ].filter(Boolean);

    const response = await query
      .where(and(...whereConditions))
      .limit(limit + 1)
      .orderBy(orderBy);

    // Transform results
    const articles = response.map((item) => ({
      type: "aggregated" as const,
      id: item.id,
      shortId: null, // Not used in new schema
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      imageUrl: item.imageUrl,
      author: item.author,
      publishedAt: item.publishedAt,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      score: item.upvotes - item.downvotes,
      clickCount: item.viewsCount,
      sourceName: item.sourceName,
      sourceSlug: item.sourceSlug,
      sourceLogo: item.sourceLogo,
      sourceWebsite: item.sourceWebsite,
      sourceCategory: item.sourceCategory,
      userVote: item.userVote as "up" | "down" | null,
      isBookmarked: Boolean(item.isBookmarked),
    }));

    // Calculate next cursor
    let nextCursor: typeof cursor | undefined = undefined;
    if (articles.length > limit) {
      const nextItem = articles.pop();
      if (nextItem) {
        nextCursor = {
          id: nextItem.id,
          publishedAt: nextItem.publishedAt || undefined,
          score: nextItem.score,
        };
      }
    }

    return { articles, nextCursor };
  }),

  // Vote on a post
  vote: protectedProcedure
    .input(VoteArticleSchema)
    .mutation(async ({ input, ctx }) => {
      const { articleId, voteType } = input;
      const userId = ctx.session.user.id;

      // Verify post exists
      const postRecord = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, articleId),
      });

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check existing vote
      const existingVote = await ctx.db.query.post_votes.findFirst({
        where: and(
          eq(post_votes.postId, articleId),
          eq(post_votes.userId, userId),
        ),
      });

      // Note: The new schema uses database triggers to update vote counts
      // So we only need to insert/update/delete the vote record

      if (voteType === null) {
        // Remove vote
        if (existingVote) {
          await ctx.db
            .delete(post_votes)
            .where(eq(post_votes.id, existingVote.id));
        }
        return { success: true, voteType: null };
      }

      if (existingVote) {
        // Update existing vote if different
        if (existingVote.voteType !== voteType) {
          await ctx.db
            .update(post_votes)
            .set({ voteType: voteType as "up" | "down" })
            .where(eq(post_votes.id, existingVote.id));
        }
      } else {
        // Insert new vote
        await ctx.db
          .insert(post_votes)
          .values({ postId: articleId, userId, voteType: voteType as "up" | "down" });
      }

      return { success: true, voteType };
    }),

  // Bookmark a post
  bookmark: protectedProcedure
    .input(BookmarkArticleSchema)
    .mutation(async ({ input, ctx }) => {
      const { articleId, setBookmarked } = input;
      const userId = ctx.session.user.id;

      // Verify post exists
      const postRecord = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, articleId),
      });

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(bookmarks)
          .values({ postId: articleId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(bookmarks)
          .where(
            and(
              eq(bookmarks.postId, articleId),
              eq(bookmarks.userId, userId),
            ),
          );
      }

      return { success: true, bookmarked: setBookmarked };
    }),

  // Track post click/view
  trackClick: publicProcedure
    .input(TrackClickSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(posts)
        .set({ viewsCount: increment(posts.viewsCount) })
        .where(eq(posts.id, input.articleId));

      return { success: true };
    }),

  // Get user's saved/bookmarked articles (uses new unified tables)
  mySavedArticles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Import from new schema
    const { posts, bookmarks, feed_sources, user: userTable } = await import("@/server/db/schema");

    const saved = await ctx.db
      .select({
        id: posts.id,
        shortId: sql<string>`NULL`, // Not used in new schema
        title: posts.title,
        excerpt: posts.excerpt,
        url: posts.externalUrl,
        imageUrl: posts.coverImage,
        ogImageUrl: posts.coverImage,
        author: posts.sourceAuthor,
        publishedAt: posts.publishedAt,
        upvotes: posts.upvotesCount,
        downvotes: posts.downvotesCount,
        sourceName: feed_sources.name,
        sourceSlug: feed_sources.slug,
        sourceLogo: feed_sources.logoUrl,
        sourceWebsite: feed_sources.websiteUrl,
        bookmarkedAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .innerJoin(posts, eq(bookmarks.postId, posts.id))
      .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return saved;
  }),

  // Get post by ID
  getById: publicProcedure
    .input(GetArticleByIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;

      // Use select query instead of relations to avoid Drizzle inference issues
      const postResults = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          coverImage: posts.coverImage,
          sourceAuthor: posts.sourceAuthor,
          sourceId: posts.sourceId,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
          sourceDescription: feed_sources.description,
        })
        .from(posts)
        .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      const postRecord = postResults[0];

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get user's vote and bookmark status
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const voteResults = await ctx.db
          .select({ voteType: post_votes.voteType })
          .from(post_votes)
          .where(and(
            eq(post_votes.postId, input.id),
            eq(post_votes.userId, userId),
          ))
          .limit(1);
        userVote = voteResults[0]?.voteType || null;

        const bookmarkResults = await ctx.db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(
            eq(bookmarks.postId, input.id),
            eq(bookmarks.userId, userId),
          ))
          .limit(1);
        isBookmarked = bookmarkResults.length > 0;
      }

      // Transform to match expected API shape
      return {
        id: postRecord.id,
        title: postRecord.title,
        slug: postRecord.slug,
        excerpt: postRecord.excerpt,
        externalUrl: postRecord.externalUrl,
        imageUrl: postRecord.coverImage,
        sourceAuthor: postRecord.sourceAuthor,
        publishedAt: postRecord.publishedAt,
        upvotes: postRecord.upvotesCount,
        downvotes: postRecord.downvotesCount,
        source: postRecord.sourceId ? {
          id: postRecord.sourceId,
          name: postRecord.sourceName,
          slug: postRecord.sourceSlug,
          logoUrl: postRecord.sourceLogo,
          websiteUrl: postRecord.sourceWebsite,
          category: postRecord.sourceCategory,
          description: postRecord.sourceDescription,
        } : null,
        userVote,
        isBookmarked,
      };
    }),

  // Get post by source slug and shortId (legacy support - redirects to slug)
  getBySlugAndShortId: publicProcedure
    .input(GetArticleBySlugAndShortIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, shortId } = input;

      // Find the source by slug
      const source = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, sourceSlug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

      // Try to find post by slug (shortId could be the slug in new schema)
      const postResults = await ctx.db
        .select()
        .from(posts)
        .where(and(
          eq(posts.slug, shortId),
          eq(posts.sourceId, source.id),
        ))
        .limit(1);

      const postRecord = postResults[0];

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Get user's vote and bookmark status
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const voteResults = await ctx.db
          .select({ voteType: post_votes.voteType })
          .from(post_votes)
          .where(and(
            eq(post_votes.postId, postRecord.id),
            eq(post_votes.userId, userId),
          ))
          .limit(1);
        userVote = voteResults[0]?.voteType || null;

        const bookmarkResults = await ctx.db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(
            eq(bookmarks.postId, postRecord.id),
            eq(bookmarks.userId, userId),
          ))
          .limit(1);
        isBookmarked = bookmarkResults.length > 0;
      }

      return {
        id: postRecord.id,
        title: postRecord.title,
        slug: postRecord.slug,
        excerpt: postRecord.excerpt,
        externalUrl: postRecord.externalUrl,
        imageUrl: postRecord.coverImage,
        sourceAuthor: postRecord.sourceAuthor,
        publishedAt: postRecord.publishedAt,
        upvotes: postRecord.upvotesCount,
        downvotes: postRecord.downvotesCount,
        source: source,  // Use the source we already fetched
        userVote,
        isBookmarked,
      };
    }),

  // Get post by source slug and post slug (SEO-friendly URL)
  getBySourceAndArticleSlug: publicProcedure
    .input(GetArticleBySourceAndArticleSlugSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, articleSlug } = input;

      // Find the source by slug
      const source = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, sourceSlug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

      // Find the post by slug and sourceId using a select query instead of relations
      const postResults = await ctx.db
        .select()
        .from(posts)
        .where(and(
          eq(posts.slug, articleSlug),
          eq(posts.sourceId, source.id),
        ))
        .limit(1);

      const postRecord = postResults[0];

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Fetch tags separately
      const tagsResult = await ctx.db
        .select({ tagId: post_tags.tagId, title: tag.title, id: tag.id })
        .from(post_tags)
        .innerJoin(tag, eq(post_tags.tagId, tag.id))
        .where(eq(post_tags.postId, postRecord.id));

      const postTags = tagsResult.map(t => ({ tag: { id: t.id, title: t.title } }));

      // Get user's vote and bookmark status
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const voteResults = await ctx.db
          .select({ voteType: post_votes.voteType })
          .from(post_votes)
          .where(and(
            eq(post_votes.postId, postRecord.id),
            eq(post_votes.userId, userId),
          ))
          .limit(1);
        userVote = voteResults[0]?.voteType || null;

        const bookmarkResults = await ctx.db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(
            eq(bookmarks.postId, postRecord.id),
            eq(bookmarks.userId, userId),
          ))
          .limit(1);
        isBookmarked = bookmarkResults.length > 0;
      }

      return {
        id: postRecord.id,
        title: postRecord.title,
        slug: postRecord.slug,
        excerpt: postRecord.excerpt,
        externalUrl: postRecord.externalUrl,
        imageUrl: postRecord.coverImage,
        sourceAuthor: postRecord.sourceAuthor,
        publishedAt: postRecord.publishedAt,
        upvotes: postRecord.upvotesCount,
        downvotes: postRecord.downvotesCount,
        source: source,  // Use the source we already fetched
        tags: postTags,
        userVote,
        isBookmarked,
      };
    }),

  // Get source profile by slug
  getSourceBySlug: publicProcedure
    .input(GetSourceBySlugSchema)
    .query(async ({ input }) => {
      const { slug } = input;

      const source = await db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, slug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

      // Get article count for this source
      const [articleCountResult] = await db
        .select({ count: count() })
        .from(posts)
        .where(and(
          eq(posts.sourceId, source.id),
          eq(posts.status, "published"),
        ));

      // Get total upvotes across all posts from this source
      const [totalVotesResult] = await db
        .select({
          totalUpvotes: sql<number>`COALESCE(SUM(${posts.upvotesCount}), 0)`,
          totalDownvotes: sql<number>`COALESCE(SUM(${posts.downvotesCount}), 0)`,
        })
        .from(posts)
        .where(and(
          eq(posts.sourceId, source.id),
          eq(posts.status, "published"),
        ));

      return {
        ...source,
        articleCount: articleCountResult.count,
        totalUpvotes: Number(totalVotesResult.totalUpvotes),
        totalDownvotes: Number(totalVotesResult.totalDownvotes),
      };
    }),

  // Get paginated posts by source
  getArticlesBySource: publicProcedure
    .input(GetArticlesBySourceSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, cursor, sort } = input;
      const limit = input.limit ?? 20;

      // Find the source by slug
      const source = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, sourceSlug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

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

      // Build order by and cursor conditions based on sort type
      const getOrderAndCursor = () => {
        switch (sort) {
          case "recent":
            return {
              orderBy: desc(posts.publishedAt),
              cursorCondition: cursor
                ? lte(
                    posts.publishedAt,
                    cursor.publishedAt as string,
                  )
                : undefined,
            };
          case "trending":
            return {
              orderBy: desc(scoreExpr),
              cursorCondition: undefined,
            };
          case "popular":
            return {
              orderBy: desc(posts.upvotesCount),
              cursorCondition: undefined,
            };
          default:
            return {
              orderBy: desc(posts.publishedAt),
              cursorCondition: undefined,
            };
        }
      };

      const { orderBy, cursorCondition } = getOrderAndCursor();

      // Base query for posts
      let query = ctx.db
        .select({
          id: posts.id,
          slug: posts.slug,
          title: posts.title,
          excerpt: posts.excerpt,
          url: posts.externalUrl,
          imageUrl: posts.coverImage,
          author: posts.sourceAuthor,
          publishedAt: posts.publishedAt,
          upvotes: posts.upvotesCount,
          downvotes: posts.downvotesCount,
          viewsCount: posts.viewsCount,
          sourceName: feed_sources.name,
          sourceSlug: feed_sources.slug,
          sourceLogo: feed_sources.logoUrl,
          sourceWebsite: feed_sources.websiteUrl,
          sourceCategory: feed_sources.category,
          userVote: userVotes ? userVotes.voteType : sql<string | null>`NULL`,
          isBookmarked: userBookmarks
            ? sql<boolean>`CASE WHEN ${userBookmarks.postId} IS NOT NULL THEN TRUE ELSE FALSE END`
            : sql<boolean>`FALSE`,
        })
        .from(posts)
        .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id));

      // Add user joins if logged in
      if (userVotes) {
        query = query.leftJoin(
          userVotes,
          eq(posts.id, userVotes.postId),
        ) as typeof query;
      }
      if (userBookmarks) {
        query = query.leftJoin(
          userBookmarks,
          eq(posts.id, userBookmarks.postId),
        ) as typeof query;
      }

      // Build where conditions
      const whereConditions = [
        eq(posts.sourceId, source.id),
        eq(posts.status, "published"),
        cursorCondition,
      ].filter(Boolean);

      const response = await query
        .where(and(...whereConditions))
        .limit(limit + 1)
        .orderBy(orderBy);

      // Transform results
      const articles = response.map((item) => ({
        type: "aggregated" as const,
        id: item.id,
        shortId: null,
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        url: item.url,
        imageUrl: item.imageUrl,
        author: item.author,
        publishedAt: item.publishedAt,
        upvotes: item.upvotes,
        downvotes: item.downvotes,
        score: item.upvotes - item.downvotes,
        clickCount: item.viewsCount,
        sourceName: item.sourceName,
        sourceSlug: item.sourceSlug,
        sourceLogo: item.sourceLogo,
        sourceWebsite: item.sourceWebsite,
        sourceCategory: item.sourceCategory,
        userVote: item.userVote as "up" | "down" | null,
        isBookmarked: Boolean(item.isBookmarked),
      }));

      // Calculate next cursor
      let nextCursor: typeof cursor | undefined = undefined;
      if (articles.length > limit) {
        const nextItem = articles.pop();
        if (nextItem) {
          nextCursor = {
            id: nextItem.id,
            publishedAt: nextItem.publishedAt || undefined,
          };
        }
      }

      return { articles, nextCursor, source };
    }),

  // Get all feed sources (public)
  getSources: publicProcedure
    .input(GetSourcesSchema.optional())
    .query(async ({ ctx, input }) => {
      const whereConditions = [];

      if (input?.status) {
        // Convert uppercase status to lowercase for new schema
        const statusLower = input.status.toLowerCase() as "active" | "paused" | "error";
        whereConditions.push(eq(feed_sources.status, statusLower));
      }
      if (input?.category) {
        whereConditions.push(eq(feed_sources.category, input.category));
      }

      return await ctx.db.query.feed_sources.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: asc(feed_sources.name),
      });
    }),

  // Get distinct categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db
      .selectDistinct({ category: feed_sources.category })
      .from(feed_sources)
      .where(
        and(eq(feed_sources.status, "active"), isNotNull(feed_sources.category)),
      );

    return categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null);
  }),

  // Get source stats for admin
  getSourceStats: adminOnlyProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select({
        sourceId: feed_sources.id,
        sourceName: feed_sources.name,
        status: feed_sources.status,
        articleCount: count(posts.id),
        lastFetchedAt: feed_sources.lastFetchedAt,
        errorCount: feed_sources.errorCount,
      })
      .from(feed_sources)
      .leftJoin(
        posts,
        eq(feed_sources.id, posts.sourceId),
      )
      .groupBy(feed_sources.id)
      .orderBy(desc(feed_sources.createdAt));

    return stats;
  }),

  // Admin: Create feed source
  createSource: adminOnlyProcedure
    .input(CreateFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if URL already exists
      const existing = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.url, input.url),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A feed source with this URL already exists",
        });
      }

      const [newSource] = await ctx.db
        .insert(feed_sources)
        .values({
          ...input,
          status: "active", // Default status for new sources
        })
        .returning();

      return newSource;
    }),

  // Admin: Update feed source
  updateSource: adminOnlyProcedure
    .input(UpdateFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feed source not found",
        });
      }

      // Build update data, converting status to lowercase if provided
      const updateData: Record<string, unknown> = { ...data };
      if (data.status) {
        updateData.status = data.status.toLowerCase() as "active" | "paused" | "error";
      }

      const [updated] = await ctx.db
        .update(feed_sources)
        .set(updateData)
        .where(eq(feed_sources.id, id))
        .returning();

      return updated;
    }),

  // Admin: Delete feed source
  deleteSource: adminOnlyProcedure
    .input(DeleteFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feed source not found",
        });
      }

      await ctx.db.delete(feed_sources).where(eq(feed_sources.id, input.id));

      return { success: true };
    }),

  // Get link post by source slug and post slug
  getLinkContentBySourceAndSlug: publicProcedure
    .input(GetLinkContentBySourceAndSlugSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, contentSlug } = input;

      // Find the source by slug
      const source = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, sourceSlug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

      // Find the link post by slug and source using select instead of relations
      const postResults = await ctx.db
        .select()
        .from(posts)
        .where(and(
          eq(posts.slug, contentSlug),
          eq(posts.sourceId, source.id),
          eq(posts.type, "link"),
          eq(posts.status, "published"),
        ))
        .limit(1);

      const postRecord = postResults[0];

      if (!postRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Link post not found",
        });
      }

      // Get user's vote and bookmark status
      let userVote: "up" | "down" | null = null;
      let isBookmarked = false;

      if (userId) {
        const voteResults = await ctx.db
          .select({ voteType: post_votes.voteType })
          .from(post_votes)
          .where(and(
            eq(post_votes.postId, postRecord.id),
            eq(post_votes.userId, userId),
          ))
          .limit(1);
        userVote = voteResults[0]?.voteType || null;

        const bookmarkResults = await ctx.db
          .select({ id: bookmarks.id })
          .from(bookmarks)
          .where(and(
            eq(bookmarks.postId, postRecord.id),
            eq(bookmarks.userId, userId),
          ))
          .limit(1);
        isBookmarked = bookmarkResults.length > 0;
      }

      return {
        id: postRecord.id,
        title: postRecord.title,
        slug: postRecord.slug,
        excerpt: postRecord.excerpt,
        externalUrl: postRecord.externalUrl,
        imageUrl: postRecord.coverImage,
        sourceAuthor: postRecord.sourceAuthor,
        publishedAt: postRecord.publishedAt,
        upvotes: postRecord.upvotesCount,
        downvotes: postRecord.downvotesCount,
        source: source,  // Use the source we already fetched
        userVote,
        isBookmarked,
      };
    }),
});
