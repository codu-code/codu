import { z } from "zod";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import {
  feed_sources,
  publication_follow,
  posts,
  post_votes,
  bookmarks,
  banned_users,
} from "@/server/db/schema";

export const publicationRouter = createTRPCRouter({
  // Get a publication (feed source) profile by slug, with stats + its
  // published posts. Public — `isFollowing` only resolves when signed in.
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const source = await ctx.db.query.feed_sources.findFirst({
        where: eq(feed_sources.slug, input.slug),
      });

      if (!source) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Publication not found",
        });
      }

      const [followerRow] = await ctx.db
        .select({ c: count() })
        .from(publication_follow)
        .where(eq(publication_follow.sourceId, source.id));

      const [articleRow] = await ctx.db
        .select({ c: count() })
        .from(posts)
        .where(
          and(eq(posts.sourceId, source.id), eq(posts.status, "published")),
        );

      let isFollowing = false;
      if (userId) {
        const [row] = await ctx.db
          .select({ id: publication_follow.id })
          .from(publication_follow)
          .where(
            and(
              eq(publication_follow.userId, userId),
              eq(publication_follow.sourceId, source.id),
            ),
          )
          .limit(1);
        isFollowing = !!row;
      }

      // Build optional per-user vote / bookmark subqueries
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
            .select({ postId: bookmarks.postId })
            .from(bookmarks)
            .where(eq(bookmarks.userId, userId))
            .as("userBookmarks")
        : null;

      // Seed with the banned_users join (always present) so the conditional
      // per-user joins below can reuse the resulting builder type.
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
          userVote: userVotes ? userVotes.voteType : sql<string | null>`NULL`,
          isBookmarked: userBookmarks
            ? sql<boolean>`CASE WHEN ${userBookmarks.postId} IS NOT NULL THEN TRUE ELSE FALSE END`
            : sql<boolean>`FALSE`,
        })
        .from(posts)
        .leftJoin(banned_users, eq(posts.authorId, banned_users.userId));

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

      const rows = await query
        .where(
          and(
            eq(posts.sourceId, source.id),
            eq(posts.status, "published"),
            isNull(banned_users.userId),
          ),
        )
        .orderBy(desc(posts.publishedAt))
        .limit(50);

      const articles = rows.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        url: item.url,
        imageUrl: item.imageUrl,
        author: item.author,
        publishedAt: item.publishedAt,
        upvotes: item.upvotes,
        downvotes: item.downvotes,
        userVote: item.userVote as "up" | "down" | null,
        isBookmarked: Boolean(item.isBookmarked),
      }));

      return {
        id: source.id,
        name: source.name,
        slug: source.slug,
        // No dedicated handle column — derive a stable @handle from the slug.
        handle: source.slug,
        logoUrl: source.logoUrl,
        websiteUrl: source.websiteUrl,
        // Reuse the existing `description` column as the tagline.
        tagline: source.description,
        followerCount: Number(followerRow?.c ?? 0),
        articleCount: Number(articleRow?.c ?? 0),
        isFollowing,
        articles,
      };
    }),

  follow: protectedProcedure
    .input(z.object({ sourceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(publication_follow)
        .values({ userId: ctx.session.user.id, sourceId: input.sourceId })
        .onConflictDoNothing();
      return { following: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ sourceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(publication_follow)
        .where(
          and(
            eq(publication_follow.userId, ctx.session.user.id),
            eq(publication_follow.sourceId, input.sourceId),
          ),
        );
      return { following: false };
    }),

  followerCount: publicProcedure
    .input(z.object({ sourceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ c: count() })
        .from(publication_follow)
        .where(eq(publication_follow.sourceId, input.sourceId));
      return Number(row?.c ?? 0);
    }),
});
