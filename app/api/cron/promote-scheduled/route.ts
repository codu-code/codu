import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";

import { env } from "@/config/env";
import { db } from "@/server/db";
import { posts, user } from "@/server/db/schema";
import { runPostGoLiveSideEffects } from "@/server/lib/post-go-live";

// Cron: promote due scheduled posts to published.
//
// A scheduled post is status='scheduled' with a future publishedAt set by a
// moderator's "approve & schedule" action. Once publishedAt <= now this route
// flips it to 'published' and runs the SAME go-live side-effects the instant
// approve path uses (award post_published, IndexNow ping, author notification).
//
// Auth: Bearer CRON_SECRET (mirrors the common Vercel-cron / internal-cron
// pattern). The existing sync-feeds route uses interactive admin-session auth,
// which a headless scheduler can't provide, so we use a shared secret here.
// Without CRON_SECRET set the route refuses to run (500/secret-not-configured),
// and any request without the matching token is rejected 401.
//
// Idempotent: only rows still in 'scheduled' are promoted, and the status flip
// is a guarded conditional update — running it twice (or concurrently) won't
// re-fire side-effects for an already-published post.
//
// SCHEDULING: this repo's crons are AWS Lambda + EventBridge (cdk/lib/
// cron-stack.ts), not vercel.json. No infra is invented here. Until a scheduler
// is wired to hit this route on a cadence (every minute / few minutes),
// scheduled posts will NOT auto-go-live. Wire it by either (a) adding an
// EventBridge-scheduled invocation that curls
// `https://www.codu.co/api/cron/promote-scheduled` with the Bearer secret, or
// (b) adding a vercel.json `crons` entry if the app moves to Vercel cron.

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function promoteDueScheduledPosts() {
  const now = new Date();

  // Find scheduled posts whose release time has arrived. Join the author for
  // the username (member canonical URL). Limit to a sane batch per run.
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
    // Guarded conditional flip: only promote if it's STILL scheduled. The
    // `returning()` rows tell us whether this invocation won the race (vs a
    // concurrent run / re-run), so side-effects fire exactly once.
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
