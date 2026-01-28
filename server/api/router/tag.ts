import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  tag,
  post_tags,
  post_tag,
  tag_merge_suggestions,
} from "@/server/db/schema";
import { desc, eq, ilike, sql, and, or, count } from "drizzle-orm";

/**
 * Generate a URL-friendly slug from a tag title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const tagRouter = createTRPCRouter({
  /**
   * Get top tags - returns most used tags with counts
   * Used for popular tags sidebar and discovery
   */
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      const data = await ctx.db
        .select({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          postCount: tag.postCount,
        })
        .from(tag)
        .orderBy(desc(tag.postCount))
        .limit(10);

      return { data };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),

  /**
   * Search tags with autocomplete - Medium-style
   * Returns matching tags with post counts for autocomplete dropdown
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(50),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { query, limit } = input;
        const searchPattern = `%${query.toLowerCase()}%`;

        const results = await ctx.db
          .select({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            postCount: tag.postCount,
          })
          .from(tag)
          .where(
            or(ilike(tag.title, searchPattern), ilike(tag.slug, searchPattern)),
          )
          .orderBy(desc(tag.postCount), tag.title)
          .limit(limit);

        return { data: results };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search tags",
        });
      }
    }),

  /**
   * Get popular tags for sidebar/discovery
   * Returns most used tags sorted by post count
   */
  getPopular: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const results = await ctx.db
          .select({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            description: tag.description,
            postCount: tag.postCount,
          })
          .from(tag)
          .orderBy(desc(tag.postCount))
          .limit(input.limit);

        return { data: results };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch popular tags",
        });
      }
    }),

  /**
   * Get or create a tag - for tag input
   * Returns existing tag or creates a new one with proper slug
   */
  getOrCreate: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1)
          .max(50)
          .transform((s) => s.toLowerCase().trim()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { title } = input;

        // Check if tag already exists
        const existing = await ctx.db
          .select({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            postCount: tag.postCount,
          })
          .from(tag)
          .where(eq(tag.title, title))
          .limit(1);

        if (existing.length > 0) {
          return { data: existing[0], created: false };
        }

        // Create new tag
        const slug = generateSlug(title);

        // Check for slug conflicts
        const slugExists = await ctx.db
          .select({ id: tag.id })
          .from(tag)
          .where(eq(tag.slug, slug))
          .limit(1);

        const finalSlug =
          slugExists.length > 0 ? `${slug}-${Date.now()}` : slug;

        const [newTag] = await ctx.db
          .insert(tag)
          .values({
            title,
            slug: finalSlug,
            postCount: 0,
          })
          .returning({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            postCount: tag.postCount,
          });

        return { data: newTag, created: true };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get or create tag",
        });
      }
    }),

  /**
   * Get tag by slug - for tag pages
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            description: tag.description,
            postCount: tag.postCount,
            createdAt: tag.createdAt,
          })
          .from(tag)
          .where(eq(tag.slug, input.slug))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        return { data: result[0] };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tag",
        });
      }
    }),

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * Get all tags with statistics for admin dashboard
   */
  getAdminStats: protectedProcedure.query(async ({ ctx }) => {
    // Check admin role
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    try {
      const results = await ctx.db
        .select({
          id: tag.id,
          title: tag.title,
          slug: tag.slug,
          description: tag.description,
          postCount: tag.postCount,
          createdAt: tag.createdAt,
        })
        .from(tag)
        .orderBy(desc(tag.postCount));

      // Get total counts
      const totalTags = results.length;
      const totalPosts = results.reduce((sum, t) => sum + t.postCount, 0);
      const tagsWithNoPosts = results.filter((t) => t.postCount === 0).length;

      return {
        data: results,
        stats: {
          totalTags,
          totalPosts,
          tagsWithNoPosts,
        },
      };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch admin stats",
      });
    }
  }),

  /**
   * Update tag details (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(50).optional(),
        description: z.string().max(500).optional().nullable(),
        slug: z.string().min(1).max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        const { id, ...updates } = input;

        // Normalize title to lowercase if provided
        if (updates.title) {
          updates.title = updates.title.toLowerCase().trim();
        }

        // Generate slug from title if title changed and slug not provided
        if (updates.title && !updates.slug) {
          updates.slug = generateSlug(updates.title);
        }

        const [updated] = await ctx.db
          .update(tag)
          .set(updates)
          .where(eq(tag.id, id))
          .returning({
            id: tag.id,
            title: tag.title,
            slug: tag.slug,
            description: tag.description,
            postCount: tag.postCount,
          });

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        return { data: updated };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tag",
        });
      }
    }),

  /**
   * Merge two tags (admin only)
   * Moves all post associations from source to target, then deletes source
   */
  mergeTags: protectedProcedure
    .input(
      z.object({
        sourceTagId: z.number(),
        targetTagId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { sourceTagId, targetTagId } = input;

      if (sourceTagId === targetTagId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot merge a tag with itself",
        });
      }

      try {
        // Get both tags to verify they exist
        const [sourceTag, targetTag] = await Promise.all([
          ctx.db.select().from(tag).where(eq(tag.id, sourceTagId)).limit(1),
          ctx.db.select().from(tag).where(eq(tag.id, targetTagId)).limit(1),
        ]);

        if (!sourceTag.length || !targetTag.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or both tags not found",
          });
        }

        // Move all post_tags associations from source to target
        // Use ON CONFLICT to handle duplicates (posts that already have both tags)
        await ctx.db.execute(sql`
          INSERT INTO "post_tags" ("post_id", "tag_id")
          SELECT "post_id", ${targetTagId}
          FROM "post_tags"
          WHERE "tag_id" = ${sourceTagId}
          ON CONFLICT ("post_id", "tag_id") DO NOTHING
        `);

        // Delete the source tag (cascade will delete remaining post_tags)
        await ctx.db.delete(tag).where(eq(tag.id, sourceTagId));

        // Recalculate post count for target tag
        const [countResult] = await ctx.db
          .select({ count: count() })
          .from(post_tags)
          .where(eq(post_tags.tagId, targetTagId));

        await ctx.db
          .update(tag)
          .set({ postCount: countResult?.count || 0 })
          .where(eq(tag.id, targetTagId));

        return {
          success: true,
          message: `Merged "${sourceTag[0].title}" into "${targetTag[0].title}"`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to merge tags",
        });
      }
    }),

  /**
   * Get merge suggestions for admin review
   */
  getMergeSuggestions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    try {
      const suggestions = await ctx.db
        .select({
          id: tag_merge_suggestions.id,
          sourceTagId: tag_merge_suggestions.sourceTagId,
          targetTagId: tag_merge_suggestions.targetTagId,
          similarityScore: tag_merge_suggestions.similarityScore,
          reason: tag_merge_suggestions.reason,
          status: tag_merge_suggestions.status,
          createdAt: tag_merge_suggestions.createdAt,
        })
        .from(tag_merge_suggestions)
        .where(eq(tag_merge_suggestions.status, "pending"))
        .orderBy(desc(tag_merge_suggestions.similarityScore));

      // Get tag details for each suggestion
      const tagIds = new Set<number>();
      for (const s of suggestions) {
        tagIds.add(s.sourceTagId);
        tagIds.add(s.targetTagId);
      }

      const tagDetails =
        tagIds.size > 0
          ? await ctx.db
              .select({
                id: tag.id,
                title: tag.title,
                slug: tag.slug,
                postCount: tag.postCount,
              })
              .from(tag)
              .where(
                sql`${tag.id} IN (${sql.join(
                  Array.from(tagIds).map((id) => sql`${id}`),
                  sql`, `,
                )})`,
              )
          : [];

      const tagMap = new Map(tagDetails.map((t) => [t.id, t]));

      const enrichedSuggestions = suggestions.map((s) => ({
        ...s,
        sourceTag: tagMap.get(s.sourceTagId),
        targetTag: tagMap.get(s.targetTagId),
      }));

      return { data: enrichedSuggestions };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch merge suggestions",
      });
    }
  }),

  /**
   * Review a merge suggestion (approve/reject)
   */
  reviewMergeSuggestion: protectedProcedure
    .input(
      z.object({
        suggestionId: z.number(),
        action: z.enum(["approved", "rejected"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      try {
        const [updated] = await ctx.db
          .update(tag_merge_suggestions)
          .set({
            status: input.action,
            reviewedById: ctx.session.user.id,
            reviewedAt: new Date().toISOString(),
          })
          .where(eq(tag_merge_suggestions.id, input.suggestionId))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Suggestion not found",
          });
        }

        return { success: true, data: updated };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to review suggestion",
        });
      }
    }),

  /**
   * Recalculate all tag post counts
   * Useful for fixing any count drift
   */
  recalculateCounts: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    try {
      // Get actual counts from post_tags
      const actualCounts = await ctx.db
        .select({
          tagId: post_tags.tagId,
          count: count(),
        })
        .from(post_tags)
        .groupBy(post_tags.tagId);

      const countMap = new Map(actualCounts.map((c) => [c.tagId, c.count]));

      // Get all tags
      const allTags = await ctx.db.select({ id: tag.id }).from(tag);

      let updated = 0;
      for (const t of allTags) {
        const actualCount = countMap.get(t.id) || 0;
        await ctx.db
          .update(tag)
          .set({ postCount: actualCount })
          .where(eq(tag.id, t.id));
        updated++;
      }

      return { success: true, updated };
    } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to recalculate counts",
      });
    }
  }),
});
