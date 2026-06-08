DROP INDEX "point_event_dedupe_idx";--> statement-breakpoint
-- Remove duplicate point events (from the pre-fix NULLS-DISTINCT gap) before
-- enforcing NULLS NOT DISTINCT — keep the earliest row per (user, action,
-- source, actor), treating NULL actor/source as equal. This also corrects
-- points that were farmed via the broken idempotency.
DELETE FROM "point_event" a USING "point_event" b
WHERE a.ctid > b.ctid
  AND a."user_id" = b."user_id"
  AND a."action" = b."action"
  AND a."source_id" IS NOT DISTINCT FROM b."source_id"
  AND a."actor_id" IS NOT DISTINCT FROM b."actor_id";--> statement-breakpoint
ALTER TABLE "point_event" ADD CONSTRAINT "point_event_dedupe_idx" UNIQUE NULLS NOT DISTINCT("user_id","action","source_id","actor_id");
