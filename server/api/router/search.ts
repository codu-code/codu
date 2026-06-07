import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { posts, user, tag, feed_sources } from "@/server/db/schema";
import { rateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";

// Live, debounced site search — replaces the external Algolia dependency.
// Cheap but abusable, so it's defended on three fronts: a per-identifier rate
// limit, a minimum query length, and hard result caps.
const MIN_QUERY = 2;
const RATE_LIMIT = 30; // requests…
const RATE_WINDOW_MS = 10_000; // …per 10s per user/IP

export const searchRouter = createTRPCRouter({
  everything: publicProcedure
    .input(
      z.object({
        query: z.string().max(80),
        limit: z.number().min(1).max(8).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const query = input.query.trim();
      const empty = { posts: [], people: [], tags: [] };
      if (query.length < MIN_QUERY) return empty;

      // Rate limit by signed-in user, falling back to client IP.
      const identifier =
        ctx.session?.user?.id ?? `ip:${clientIpFromHeaders(ctx.headers)}`;
      const { success } = rateLimit(
        `search:${identifier}`,
        RATE_LIMIT,
        RATE_WINDOW_MS,
      );
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You're searching too fast. Give it a second.",
        });
      }

      const like = `%${query}%`;
      const limit = input.limit;

      const [postRows, peopleRows, tagRows] = await Promise.all([
        ctx.db
          .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            type: posts.type,
            upvotes: posts.upvotesCount,
            authorUsername: user.username,
            sourceSlug: feed_sources.slug,
          })
          .from(posts)
          .leftJoin(user, eq(posts.authorId, user.id))
          .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
          .where(
            and(
              eq(posts.status, "published"),
              or(ilike(posts.title, like), ilike(posts.excerpt, like)),
            ),
          )
          .orderBy(desc(posts.upvotesCount))
          .limit(limit),
        ctx.db
          .select({
            username: user.username,
            name: user.name,
            image: user.image,
          })
          .from(user)
          .where(
            and(
              sql`${user.username} is not null`,
              or(ilike(user.name, like), ilike(user.username, like)),
            ),
          )
          .limit(limit),
        ctx.db
          .select({
            title: tag.title,
            slug: tag.slug,
            postCount: tag.postCount,
          })
          .from(tag)
          .where(or(ilike(tag.title, like), ilike(tag.slug, like)))
          .orderBy(desc(tag.postCount))
          .limit(limit),
      ]);

      return {
        posts: postRows.map((p) => ({
          id: p.id,
          title: p.title,
          type: p.type,
          upvotes: p.upvotes,
          href: p.authorUsername
            ? `/${p.authorUsername}/${p.slug}`
            : p.sourceSlug
              ? `/${p.sourceSlug}/${p.slug}`
              : `/articles/${p.slug}`,
        })),
        people: peopleRows
          .filter((u) => u.username)
          .map((u) => ({
            username: u.username as string,
            name: u.name,
            image: u.image,
          })),
        tags: tagRows,
      };
    }),
});
