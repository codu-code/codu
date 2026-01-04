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
  GetSourceBySlugSchema,
  GetArticlesBySourceSchema,
} from "../../../schema/feed";
import {
  aggregated_article,
  aggregated_article_vote,
  aggregated_article_bookmark,
  feed_source,
  aggregated_article_tag,
  tag,
  post,
  user,
  bookmark,
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
  // Get aggregated feed with optional community posts
  getFeed: publicProcedure.input(GetFeedSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const limit = input?.limit ?? 20;
    const { cursor, sort, category, tag: tagFilter, includeCommunity } = input;

    // Build the vote subquery for current user
    const userVotes = userId
      ? ctx.db
          .select({
            articleId: aggregated_article_vote.articleId,
            voteType: aggregated_article_vote.voteType,
          })
          .from(aggregated_article_vote)
          .where(eq(aggregated_article_vote.userId, userId))
          .as("userVotes")
      : null;

    // Build the bookmark subquery for current user
    const userBookmarks = userId
      ? ctx.db
          .select({
            articleId: aggregated_article_bookmark.articleId,
          })
          .from(aggregated_article_bookmark)
          .where(eq(aggregated_article_bookmark.userId, userId))
          .as("userBookmarks")
      : null;

    // Calculate score for trending
    const scoreExpr = sql<number>`(${aggregated_article.upvotes} - ${aggregated_article.downvotes})`;

    // Build order by and cursor conditions based on sort type
    const getOrderAndCursor = () => {
      switch (sort) {
        case "recent":
          return {
            orderBy: desc(aggregated_article.publishedAt),
            cursorCondition: cursor
              ? lte(aggregated_article.publishedAt, cursor.publishedAt as string)
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
            orderBy: desc(aggregated_article.upvotes),
            cursorCondition: cursor
              ? lt(aggregated_article.upvotes, cursor.score as number)
              : undefined,
          };
        default:
          return {
            orderBy: desc(aggregated_article.publishedAt),
            cursorCondition: undefined,
          };
      }
    };

    const { orderBy, cursorCondition } = getOrderAndCursor();

    // Base query for aggregated articles
    let query = ctx.db
      .select({
        id: aggregated_article.id,
        shortId: aggregated_article.shortId,
        title: aggregated_article.title,
        excerpt: aggregated_article.excerpt,
        url: aggregated_article.url,
        imageUrl: aggregated_article.imageUrl,
        ogImageUrl: aggregated_article.ogImageUrl,
        author: aggregated_article.author,
        publishedAt: aggregated_article.publishedAt,
        upvotes: aggregated_article.upvotes,
        downvotes: aggregated_article.downvotes,
        clickCount: aggregated_article.clickCount,
        sourceName: feed_source.name,
        sourceSlug: feed_source.slug,
        sourceLogo: feed_source.logoUrl,
        sourceWebsite: feed_source.websiteUrl,
        sourceCategory: feed_source.category,
        userVote: userVotes ? userVotes.voteType : sql<string | null>`NULL`,
        isBookmarked: userBookmarks
          ? sql<boolean>`CASE WHEN ${userBookmarks.articleId} IS NOT NULL THEN TRUE ELSE FALSE END`
          : sql<boolean>`FALSE`,
      })
      .from(aggregated_article)
      .leftJoin(feed_source, eq(aggregated_article.sourceId, feed_source.id));

    // Add user joins if logged in
    if (userVotes) {
      query = query.leftJoin(
        userVotes,
        eq(aggregated_article.id, userVotes.articleId),
      ) as typeof query;
    }
    if (userBookmarks) {
      query = query.leftJoin(
        userBookmarks,
        eq(aggregated_article.id, userBookmarks.articleId),
      ) as typeof query;
    }

    // Build where conditions
    const whereConditions = [
      eq(feed_source.status, "ACTIVE"),
      category ? eq(feed_source.category, category) : undefined,
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
      shortId: item.shortId,
      title: item.title,
      excerpt: item.excerpt,
      url: item.url,
      imageUrl: item.ogImageUrl || item.imageUrl,
      author: item.author,
      publishedAt: item.publishedAt,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      score: item.upvotes - item.downvotes,
      clickCount: item.clickCount,
      sourceName: item.sourceName,
      sourceSlug: item.sourceSlug,
      sourceLogo: item.sourceLogo,
      sourceWebsite: item.sourceWebsite,
      sourceCategory: item.sourceCategory,
      userVote: item.userVote as "UP" | "DOWN" | null,
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

  // Vote on an aggregated article
  vote: protectedProcedure
    .input(VoteArticleSchema)
    .mutation(async ({ input, ctx }) => {
      const { articleId, voteType } = input;
      const userId = ctx.session.user.id;

      // Verify article exists
      const article = await ctx.db.query.aggregated_article.findFirst({
        where: eq(aggregated_article.id, articleId),
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Check existing vote
      const existingVote =
        await ctx.db.query.aggregated_article_vote.findFirst({
          where: and(
            eq(aggregated_article_vote.articleId, articleId),
            eq(aggregated_article_vote.userId, userId),
          ),
        });

      return await ctx.db.transaction(async (tx) => {
        if (voteType === null) {
          // Remove vote
          if (existingVote) {
            await tx
              .delete(aggregated_article_vote)
              .where(eq(aggregated_article_vote.id, existingVote.id));

            // Update counts
            if (existingVote.voteType === "UP") {
              await tx
                .update(aggregated_article)
                .set({ upvotes: decrement(aggregated_article.upvotes) })
                .where(eq(aggregated_article.id, articleId));
            } else {
              await tx
                .update(aggregated_article)
                .set({ downvotes: decrement(aggregated_article.downvotes) })
                .where(eq(aggregated_article.id, articleId));
            }
          }
          return { success: true, voteType: null };
        }

        if (existingVote) {
          // Update existing vote if different
          if (existingVote.voteType !== voteType) {
            await tx
              .update(aggregated_article_vote)
              .set({ voteType })
              .where(eq(aggregated_article_vote.id, existingVote.id));

            // Adjust counts (swap vote)
            if (voteType === "UP") {
              await tx
                .update(aggregated_article)
                .set({
                  upvotes: increment(aggregated_article.upvotes),
                  downvotes: decrement(aggregated_article.downvotes),
                })
                .where(eq(aggregated_article.id, articleId));
            } else {
              await tx
                .update(aggregated_article)
                .set({
                  upvotes: decrement(aggregated_article.upvotes),
                  downvotes: increment(aggregated_article.downvotes),
                })
                .where(eq(aggregated_article.id, articleId));
            }
          }
        } else {
          // Insert new vote
          await tx
            .insert(aggregated_article_vote)
            .values({ articleId, userId, voteType });

          if (voteType === "UP") {
            await tx
              .update(aggregated_article)
              .set({ upvotes: increment(aggregated_article.upvotes) })
              .where(eq(aggregated_article.id, articleId));
          } else {
            await tx
              .update(aggregated_article)
              .set({ downvotes: increment(aggregated_article.downvotes) })
              .where(eq(aggregated_article.id, articleId));
          }
        }

        return { success: true, voteType };
      });
    }),

  // Bookmark an aggregated article
  bookmark: protectedProcedure
    .input(BookmarkArticleSchema)
    .mutation(async ({ input, ctx }) => {
      const { articleId, setBookmarked } = input;
      const userId = ctx.session.user.id;

      // Verify article exists
      const article = await ctx.db.query.aggregated_article.findFirst({
        where: eq(aggregated_article.id, articleId),
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(aggregated_article_bookmark)
          .values({ articleId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(aggregated_article_bookmark)
          .where(
            and(
              eq(aggregated_article_bookmark.articleId, articleId),
              eq(aggregated_article_bookmark.userId, userId),
            ),
          );
      }

      return { success: true, bookmarked: setBookmarked };
    }),

  // Track article click
  trackClick: publicProcedure
    .input(TrackClickSchema)
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(aggregated_article)
        .set({ clickCount: increment(aggregated_article.clickCount) })
        .where(eq(aggregated_article.id, input.articleId));

      return { success: true };
    }),

  // Get user's saved/bookmarked aggregated articles
  mySavedArticles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const saved = await ctx.db
      .select({
        id: aggregated_article.id,
        shortId: aggregated_article.shortId,
        title: aggregated_article.title,
        excerpt: aggregated_article.excerpt,
        url: aggregated_article.url,
        imageUrl: aggregated_article.imageUrl,
        ogImageUrl: aggregated_article.ogImageUrl,
        author: aggregated_article.author,
        publishedAt: aggregated_article.publishedAt,
        upvotes: aggregated_article.upvotes,
        downvotes: aggregated_article.downvotes,
        sourceName: feed_source.name,
        sourceSlug: feed_source.slug,
        sourceLogo: feed_source.logoUrl,
        sourceWebsite: feed_source.websiteUrl,
        bookmarkedAt: aggregated_article_bookmark.createdAt,
      })
      .from(aggregated_article_bookmark)
      .innerJoin(
        aggregated_article,
        eq(aggregated_article_bookmark.articleId, aggregated_article.id),
      )
      .leftJoin(feed_source, eq(aggregated_article.sourceId, feed_source.id))
      .where(eq(aggregated_article_bookmark.userId, userId))
      .orderBy(desc(aggregated_article_bookmark.createdAt));

    return saved;
  }),

  // Get article by ID
  getById: publicProcedure
    .input(GetArticleByIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;

      const article = await ctx.db.query.aggregated_article.findFirst({
        where: eq(aggregated_article.id, input.id),
        with: {
          source: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Get user's vote and bookmark status
      let userVote: "UP" | "DOWN" | null = null;
      let isBookmarked = false;

      if (userId) {
        const vote = await ctx.db.query.aggregated_article_vote.findFirst({
          where: and(
            eq(aggregated_article_vote.articleId, input.id),
            eq(aggregated_article_vote.userId, userId),
          ),
        });
        userVote = vote?.voteType || null;

        const bookmarkRecord =
          await ctx.db.query.aggregated_article_bookmark.findFirst({
            where: and(
              eq(aggregated_article_bookmark.articleId, input.id),
              eq(aggregated_article_bookmark.userId, userId),
            ),
          });
        isBookmarked = !!bookmarkRecord;
      }

      return {
        ...article,
        userVote,
        isBookmarked,
      };
    }),

  // Get article by source slug and shortId (Reddit-style URL)
  getBySlugAndShortId: publicProcedure
    .input(GetArticleBySlugSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, shortId } = input;

      // Find the source by slug
      const source = await ctx.db.query.feed_source.findFirst({
        where: eq(feed_source.slug, sourceSlug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Source not found",
        });
      }

      // Find the article by shortId and sourceId
      const article = await ctx.db.query.aggregated_article.findFirst({
        where: and(
          eq(aggregated_article.shortId, shortId),
          eq(aggregated_article.sourceId, source.id),
        ),
        with: {
          source: true,
          tags: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found",
        });
      }

      // Get user's vote and bookmark status
      let userVote: "UP" | "DOWN" | null = null;
      let isBookmarked = false;

      if (userId) {
        const vote = await ctx.db.query.aggregated_article_vote.findFirst({
          where: and(
            eq(aggregated_article_vote.articleId, article.id),
            eq(aggregated_article_vote.userId, userId),
          ),
        });
        userVote = vote?.voteType || null;

        const bookmarkRecord =
          await ctx.db.query.aggregated_article_bookmark.findFirst({
            where: and(
              eq(aggregated_article_bookmark.articleId, article.id),
              eq(aggregated_article_bookmark.userId, userId),
            ),
          });
        isBookmarked = !!bookmarkRecord;
      }

      return {
        ...article,
        userVote,
        isBookmarked,
      };
    }),

  // Get source profile by slug
  getSourceBySlug: publicProcedure
    .input(GetSourceBySlugSchema)
    .query(async ({ input }) => {
      const { slug } = input;

      const source = await db.query.feed_source.findFirst({
        where: eq(feed_source.slug, slug),
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
        .from(aggregated_article)
        .where(eq(aggregated_article.sourceId, source.id));

      // Get total upvotes across all articles from this source
      const [totalVotesResult] = await db
        .select({
          totalUpvotes: sql<number>`COALESCE(SUM(${aggregated_article.upvotes}), 0)`,
          totalDownvotes: sql<number>`COALESCE(SUM(${aggregated_article.downvotes}), 0)`,
        })
        .from(aggregated_article)
        .where(eq(aggregated_article.sourceId, source.id));

      return {
        ...source,
        articleCount: articleCountResult.count,
        totalUpvotes: Number(totalVotesResult.totalUpvotes),
        totalDownvotes: Number(totalVotesResult.totalDownvotes),
      };
    }),

  // Get paginated articles by source
  getArticlesBySource: publicProcedure
    .input(GetArticlesBySourceSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const { sourceSlug, limit, cursor, sort } = input;

      // Find the source by slug
      const source = await ctx.db.query.feed_source.findFirst({
        where: eq(feed_source.slug, sourceSlug),
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
              articleId: aggregated_article_vote.articleId,
              voteType: aggregated_article_vote.voteType,
            })
            .from(aggregated_article_vote)
            .where(eq(aggregated_article_vote.userId, userId))
            .as("userVotes")
        : null;

      // Build the bookmark subquery for current user
      const userBookmarks = userId
        ? ctx.db
            .select({
              articleId: aggregated_article_bookmark.articleId,
            })
            .from(aggregated_article_bookmark)
            .where(eq(aggregated_article_bookmark.userId, userId))
            .as("userBookmarks")
        : null;

      // Calculate score for trending
      const scoreExpr = sql<number>`(${aggregated_article.upvotes} - ${aggregated_article.downvotes})`;

      // Build order by and cursor conditions based on sort type
      const getOrderAndCursor = () => {
        switch (sort) {
          case "recent":
            return {
              orderBy: desc(aggregated_article.publishedAt),
              cursorCondition: cursor
                ? lte(
                    aggregated_article.publishedAt,
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
              orderBy: desc(aggregated_article.upvotes),
              cursorCondition: undefined,
            };
          default:
            return {
              orderBy: desc(aggregated_article.publishedAt),
              cursorCondition: undefined,
            };
        }
      };

      const { orderBy, cursorCondition } = getOrderAndCursor();

      // Base query for aggregated articles
      let query = ctx.db
        .select({
          id: aggregated_article.id,
          shortId: aggregated_article.shortId,
          title: aggregated_article.title,
          excerpt: aggregated_article.excerpt,
          url: aggregated_article.url,
          imageUrl: aggregated_article.imageUrl,
          ogImageUrl: aggregated_article.ogImageUrl,
          author: aggregated_article.author,
          publishedAt: aggregated_article.publishedAt,
          upvotes: aggregated_article.upvotes,
          downvotes: aggregated_article.downvotes,
          clickCount: aggregated_article.clickCount,
          sourceName: feed_source.name,
          sourceSlug: feed_source.slug,
          sourceLogo: feed_source.logoUrl,
          sourceWebsite: feed_source.websiteUrl,
          sourceCategory: feed_source.category,
          userVote: userVotes ? userVotes.voteType : sql<string | null>`NULL`,
          isBookmarked: userBookmarks
            ? sql<boolean>`CASE WHEN ${userBookmarks.articleId} IS NOT NULL THEN TRUE ELSE FALSE END`
            : sql<boolean>`FALSE`,
        })
        .from(aggregated_article)
        .leftJoin(feed_source, eq(aggregated_article.sourceId, feed_source.id));

      // Add user joins if logged in
      if (userVotes) {
        query = query.leftJoin(
          userVotes,
          eq(aggregated_article.id, userVotes.articleId),
        ) as typeof query;
      }
      if (userBookmarks) {
        query = query.leftJoin(
          userBookmarks,
          eq(aggregated_article.id, userBookmarks.articleId),
        ) as typeof query;
      }

      // Build where conditions
      const whereConditions = [
        eq(aggregated_article.sourceId, source.id),
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
        shortId: item.shortId,
        title: item.title,
        excerpt: item.excerpt,
        url: item.url,
        imageUrl: item.ogImageUrl || item.imageUrl,
        author: item.author,
        publishedAt: item.publishedAt,
        upvotes: item.upvotes,
        downvotes: item.downvotes,
        score: item.upvotes - item.downvotes,
        clickCount: item.clickCount,
        sourceName: item.sourceName,
        sourceSlug: item.sourceSlug,
        sourceLogo: item.sourceLogo,
        sourceWebsite: item.sourceWebsite,
        sourceCategory: item.sourceCategory,
        userVote: item.userVote as "UP" | "DOWN" | null,
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
        whereConditions.push(eq(feed_source.status, input.status));
      }
      if (input?.category) {
        whereConditions.push(eq(feed_source.category, input.category));
      }

      return await ctx.db.query.feed_source.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: asc(feed_source.name),
      });
    }),

  // Get distinct categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db
      .selectDistinct({ category: feed_source.category })
      .from(feed_source)
      .where(
        and(eq(feed_source.status, "ACTIVE"), isNotNull(feed_source.category)),
      );

    return categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null);
  }),

  // Get source stats for admin
  getSourceStats: adminOnlyProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select({
        sourceId: feed_source.id,
        sourceName: feed_source.name,
        status: feed_source.status,
        articleCount: count(aggregated_article.id),
        lastFetchedAt: feed_source.lastFetchedAt,
        errorCount: feed_source.errorCount,
      })
      .from(feed_source)
      .leftJoin(
        aggregated_article,
        eq(feed_source.id, aggregated_article.sourceId),
      )
      .groupBy(feed_source.id)
      .orderBy(desc(feed_source.createdAt));

    return stats;
  }),

  // Admin: Create feed source
  createSource: adminOnlyProcedure
    .input(CreateFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if URL already exists
      const existing = await ctx.db.query.feed_source.findFirst({
        where: eq(feed_source.url, input.url),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A feed source with this URL already exists",
        });
      }

      const [newSource] = await ctx.db
        .insert(feed_source)
        .values(input)
        .returning();

      return newSource;
    }),

  // Admin: Update feed source
  updateSource: adminOnlyProcedure
    .input(UpdateFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await ctx.db.query.feed_source.findFirst({
        where: eq(feed_source.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feed source not found",
        });
      }

      const [updated] = await ctx.db
        .update(feed_source)
        .set(data)
        .where(eq(feed_source.id, id))
        .returning();

      return updated;
    }),

  // Admin: Delete feed source
  deleteSource: adminOnlyProcedure
    .input(DeleteFeedSourceSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.query.feed_source.findFirst({
        where: eq(feed_source.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feed source not found",
        });
      }

      await ctx.db.delete(feed_source).where(eq(feed_source.id, input.id));

      return { success: true };
    }),
});
