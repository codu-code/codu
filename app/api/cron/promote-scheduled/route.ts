import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/server/db";
import { posts, user } from "@/server/db/schema";
import { runPostGoLiveSideEffects } from "@/server/lib/post-go-live";

// Cron: promote due scheduled posts (publishedAt <= now) to published and run
// the same go-live side-effects as the instant approve path. Auth via Bearer
// CRON_SECRET (a headless scheduler can't use admin-session auth); unset secret
// refuses to run (500), wrong/missing token 401. Idempotent — the status flip is
// guarded so re-runs / concurrent runs don't re-fire side-effects.
// Scheduling is wired via AWS Lambda + EventBridge (cdk/lib/cron-stack.ts).

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function promoteDueScheduledPosts() {
  const now = new Date();

  // Scheduled posts whose release time has arrived; author join for the
  // canonical username. Batched per run.
  const due = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      type: posts.type,
      slug: posts.slug,
      sourceId: posts.sourceId,
      canonicalUrl: posts.canonicalUrl,
      authorUsername: user.username,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(eq(posts.status, "scheduled"), lte(posts.publishedAt, now.toISOString())),
    )
    .limit(100);

  let promoted = 0;

  for (const post of due) {
    // Guarded flip: promote only if STILL scheduled; the returned rows tell us
    // whether this run won the race, so side-effects fire exactly once.
    const flipped = await db
      .update(posts)
      .set({ status: "published" })
      .where(and(eq(posts.id, post.id), eq(posts.status, "scheduled")))
      .returning({ id: posts.id });

    if (flipped.length === 0) continue;

    await runPostGoLiveSideEffects(db, {
      id: post.id,
      authorId: post.authorId,
      type: post.type,
      slug: post.slug,
      authorUsername: post.authorUsername,
      sourceId: post.sourceId,
      canonicalUrl: post.canonicalUrl,
    });

    promoted += 1;
  }

  return promoted;
}

async function handle(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const promoted = await promoteDueScheduledPosts();
    return NextResponse.json({ promoted });
  } catch (error) {
    console.error("Failed to promote scheduled posts:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Support both GET (simple curl / EventBridge) and POST.
export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
