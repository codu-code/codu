import crypto from "crypto";
import { and, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminOnlyProcedure,
  rateLimitedProcedure,
} from "../trpc";
import { job } from "@/server/db/schema";
import {
  saveJobsSchema,
  GetJobsSchema,
  GetJobBySlugSchema,
  GetJobByIdSchema,
  ModerateJobSchema,
  FeatureJobSchema,
} from "@/schema/job";
import sendEmail from "@/utils/sendEmail";
import { escapeHtml } from "@/utils/escapeHtml";

// Slug helper mirrors the pattern used in the post router.
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
  const uniqueId = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${uniqueId}`;
}

const LISTING_DAYS = 30;

export const jobRouter = createTRPCRouter({
  // Create a listing. Lands in pending_payment until payment + moderation.
  create: rateLimitedProcedure({
    name: "job-create",
    limit: 5,
    windowMs: 10 * 60_000,
    message:
      "You're creating job listings too fast. Take a breather and try again.",
  })
    .input(saveJobsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const slug = generateSlug(`${input.companyName}-${input.jobTitle}`);
        const now = new Date();
        const expiresAt = new Date(
          now.getTime() + LISTING_DAYS * 24 * 60 * 60 * 1000,
        );

        const [created] = await ctx.db
          .insert(job)
          .values({
            userId: ctx.session.user.id,
            companyName: input.companyName,
            companyLogo: input.companyLogo ?? null,
            jobTitle: input.jobTitle,
            slug,
            jobDescription: input.jobDescription ?? null,
            jobLocation: input.jobLocation,
            applicationUrl: input.applicationUrl || null,
            type: input.jobType,
            remote: input.remote,
            relocation: input.relocation,
            visaSponsorship: input.visa_sponsorship,
            tags: input.tags ?? [],
            aiNative: input.aiNative ?? false,
            status: "pending_payment",
            expiresAt: expiresAt.toISOString(),
          })
          .returning({ id: job.id, slug: job.slug });

        // Notify an admin that a listing needs review.
        const adminEmail = process.env.ADMIN_EMAIL || "hello@codu.co";
        try {
          await sendEmail({
            recipient: adminEmail,
            subject: `New job listing: ${input.jobTitle} @ ${input.companyName}`,
            htmlMessage: `<p>A new job listing was submitted and is awaiting payment/moderation.</p>
              <ul>
                <li><strong>Title:</strong> ${escapeHtml(input.jobTitle)}</li>
                <li><strong>Company:</strong> ${escapeHtml(input.companyName)}</li>
                <li><strong>Location:</strong> ${escapeHtml(input.jobLocation)}</li>
                <li><strong>Type:</strong> ${escapeHtml(input.jobType)}</li>
              </ul>`,
          });
        } catch (emailError) {
          // Don't fail the submission if the notification email fails.
          Sentry.captureException(emailError);
        }

        return created;
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create job listing. Please try again.",
        });
      }
    }),

  // Public listing of active jobs with filters + keyset pagination.
  list: publicProcedure.input(GetJobsSchema).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 20;
    const now = new Date().toISOString();

    const conditions = [
      eq(job.status, "active"),
      or(isNull(job.expiresAt), gt(job.expiresAt, now)),
    ];

    if (input.remote != null) conditions.push(eq(job.remote, input.remote));
    if (input.jobType) conditions.push(eq(job.type, input.jobType));
    if (input.aiNative != null)
      conditions.push(eq(job.aiNative, input.aiNative));
    if (input.tag) conditions.push(sql`${input.tag} = ANY(${job.tags})`);
    if (input.cursor?.publishedAt) {
      conditions.push(
        or(
          lt(job.publishedAt, input.cursor.publishedAt),
          and(
            eq(job.publishedAt, input.cursor.publishedAt),
            lt(job.id, input.cursor.id),
          ),
        ),
      );
    }

    const rows = await ctx.db
      .select()
      .from(job)
      .where(and(...conditions))
      .orderBy(desc(job.featured), desc(job.publishedAt), desc(job.id))
      .limit(limit + 1);

    let nextCursor: { id: string; publishedAt?: string } | undefined;
    if (rows.length > limit) {
      const next = rows.pop()!;
      nextCursor = { id: next.id, publishedAt: next.publishedAt ?? undefined };
    }

    return { jobs: rows, nextCursor };
  }),

  // Public detail by slug (active only).
  getBySlug: publicProcedure
    .input(GetJobBySlugSchema)
    .query(async ({ ctx, input }) => {
      const [found] = await ctx.db
        .select()
        .from(job)
        .where(and(eq(job.slug, input.slug), eq(job.status, "active")))
        .limit(1);

      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      return found;
    }),

  // Owner/admin can view a listing in any status (e.g. preview before payment).
  getById: protectedProcedure
    .input(GetJobByIdSchema)
    .query(async ({ ctx, input }) => {
      const [found] = await ctx.db
        .select()
        .from(job)
        .where(eq(job.id, input.id))
        .limit(1);

      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      const isOwner = found.userId === ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return found;
    }),

  // The signed-in user's own listings (any status).
  myJobs: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(job)
      .where(eq(job.userId, ctx.session.user.id))
      .orderBy(desc(job.createdAt));
  }),

  // Moderation queue: paid/submitted listings awaiting review.
  adminList: adminOnlyProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(job)
      .where(or(eq(job.status, "pending"), eq(job.status, "pending_payment")))
      .orderBy(desc(job.createdAt));
  }),

  // Approve or reject a listing.
  moderate: adminOnlyProcedure
    .input(ModerateJobSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.action === "approve") {
        const [updated] = await ctx.db
          .update(job)
          .set({
            status: "active",
            publishedAt: new Date().toISOString(),
            approvedById: ctx.session.user.id,
            approvedAt: new Date().toISOString(),
            rejectionReason: null,
          })
          .where(eq(job.id, input.id))
          .returning({ id: job.id, slug: job.slug, status: job.status });
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
        }
        return updated;
      }

      const [updated] = await ctx.db
        .update(job)
        .set({
          status: "rejected",
          rejectionReason: input.rejectionReason ?? null,
        })
        .where(eq(job.id, input.id))
        .returning({ id: job.id, status: job.status });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      return updated;
    }),

  // Toggle the featured (paid upgrade) flag.
  setFeatured: adminOnlyProcedure
    .input(FeatureJobSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(job)
        .set({ featured: input.featured })
        .where(eq(job.id, input.id))
        .returning({ id: job.id, featured: job.featured });
      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }
      return updated;
    }),

  // Payment stub: marks a listing paid and moves it to the moderation queue.
  // A real payment webhook will call this once a provider is wired up (as a
  // signed server-to-server route, not this procedure). Until then it is
  // admin-only — an owner must not be able to self-mark their listing paid and
  // get a free, unpaid listing into the queue.
  markPaid: adminOnlyProcedure
    .input(GetJobByIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [found] = await ctx.db
        .select({ id: job.id, userId: job.userId })
        .from(job)
        .where(eq(job.id, input.id))
        .limit(1);

      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
      }

      const [updated] = await ctx.db
        .update(job)
        .set({ status: "pending", paidAt: new Date().toISOString() })
        .where(eq(job.id, input.id))
        .returning({ id: job.id, status: job.status });
      return updated;
    }),
});
