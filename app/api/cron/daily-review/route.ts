import { NextResponse } from "next/server";
import {
  and,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  or,
} from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/config/env";
import { db } from "@/server/db";
import {
  comments,
  post_metadata,
  post_topic,
  posts,
  reports,
  topic,
  user,
} from "@/server/db/schema";
import { isBedrockEnabled } from "@/server/lib/bedrock";
import {
  analyzePost,
  ANALYSIS_SCHEMA_VERSION,
  type TopicVocabEntry,
} from "@/server/lib/contentAnalysis";
import { autoReview } from "@/server/lib/autoReview";
import {
  findRecentlyActiveUsers,
  recomputeUserAffinity,
} from "@/server/lib/topicAffinity";
import sendEmail from "@/utils/sendEmail";

// Nightly review cron (auth via CRON_SECRET; invoked by EventBridge — see
// cdk/lib/cron-stack.ts). Incremental, capped passes that no-op on an empty
// worklist: topic/sentiment tagging, quality scoring, post+comment moderation
// re-screen, affinity recompute, and a digest email. Each item is isolated
// (try/catch + Sentry) so one bad row never kills the batch.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const POST_CAP = 100;
const COMMENT_CAP = 200;
// Sentinel modelId for heuristic-scored rows (Bedrock off), so they're distinct
// from human-curated rows (modelId IS NULL) and can be upgraded once it's on.
const HEURISTIC_MODEL = "heuristic";

function isAuthorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Map the model's free-text moderation category to a reports.reason enum. */
function mapReason(
  category: string,
): "spam" | "nsfw" | "off_topic" | "misinformation" | "other" {
  const c = category.toLowerCase();
  if (c.includes("nsfw") || c.includes("porn") || c.includes("sexual"))
    return "nsfw";
  if (c.includes("spam") || c.includes("crypto") || c.includes("shill"))
    return "spam";
  if (c.includes("off") || c.includes("topic") || c.includes("theme"))
    return "off_topic";
  if (c.includes("misinfo") || c.includes("scam") || c.includes("fraud"))
    return "misinformation";
  return "other";
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Raise a system (auto-flagged) report unless one is already pending. */
async function raiseSystemReport(opts: {
  postId?: string;
  commentId?: string;
  category: string;
  reason: string;
}): Promise<boolean> {
  const target = opts.postId
    ? eq(reports.postId, opts.postId)
    : eq(reports.commentId, opts.commentId as string);
  const existing = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(target, eq(reports.source, "system"), eq(reports.status, "pending")),
    )
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(reports).values({
    postId: opts.postId ?? null,
    commentId: opts.commentId ?? null,
    reporterId: null,
    source: "system",
    reason: mapReason(opts.category),
    details: opts.reason || "Auto-flagged by nightly review",
    status: "pending",
  });
  return true;
}

async function reviewPosts(
  vocab: TopicVocabEntry[],
  slugToId: Map<string, number>,
): Promise<{ analyzed: number; flagged: number; proposed: number }> {
  const bedrock = isBedrockEnabled();
  const now = new Date().toISOString();

  // Worklist: published posts never analysed, stale (edited / schema bumped), or
  // a heuristic placeholder now Bedrock is on. modelId IS NULL = human-curated, skip.
  const staleBranches = [
    gt(posts.updatedAt, post_metadata.analyzedAt),
    lt(post_metadata.schemaVersion, ANALYSIS_SCHEMA_VERSION),
  ];
  if (bedrock) staleBranches.push(eq(post_metadata.modelId, HEURISTIC_MODEL));

  const worklist = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      body: posts.body,
      externalUrl: posts.externalUrl,
    })
    .from(posts)
    .leftJoin(post_metadata, eq(post_metadata.postId, posts.id))
    .where(
      and(
        eq(posts.status, "published"),
        or(
          isNull(post_metadata.postId),
          and(isNotNull(post_metadata.modelId), or(...staleBranches)),
        ),
      ),
    )
    .orderBy(desc(posts.updatedAt))
    .limit(POST_CAP);

  let analyzed = 0;
  let flagged = 0;
  let proposed = 0;

  for (const post of worklist) {
    try {
      const analysis = await analyzePost(
        {
          type: post.type,
          title: post.title,
          body: post.body,
          externalUrl: post.externalUrl,
        },
        vocab,
      );

      // Pass 3 (moderation) runs whether or not Bedrock is enabled.
      if (analysis.moderation.verdict === "review") {
        const raised = await raiseSystemReport({
          postId: post.id,
          category: analysis.moderation.category,
          reason: analysis.moderation.reason,
        });
        if (raised) flagged += 1;
      }

      // Passes 1+2 (tagging / sentiment / quality) need Bedrock. When it's off
      // we still advance the watermark with a heuristic placeholder so the post
      // doesn't re-enter the worklist every run.
      await db
        .insert(post_metadata)
        .values({
          postId: post.id,
          sentiment: analysis.sentiment,
          sentimentScore: analysis.sentimentScore,
          qualityScore: analysis.qualityScore,
          qualityReason: analysis.qualityReason,
          modelId: bedrock
            ? (process.env.BEDROCK_MODEL_ID as string)
            : HEURISTIC_MODEL,
          analyzedAt: now,
          schemaVersion: ANALYSIS_SCHEMA_VERSION,
        })
        .onConflictDoUpdate({
          target: post_metadata.postId,
          set: {
            sentiment: analysis.sentiment,
            sentimentScore: analysis.sentimentScore,
            qualityScore: analysis.qualityScore,
            qualityReason: analysis.qualityReason,
            modelId: bedrock
              ? (process.env.BEDROCK_MODEL_ID as string)
              : HEURISTIC_MODEL,
            analyzedAt: now,
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
          },
        });

      if (bedrock) {
        // Rewrite only our own AI edges; manual edges are never touched.
        await db
          .delete(post_topic)
          .where(
            and(eq(post_topic.postId, post.id), eq(post_topic.source, "ai")),
          );

        const edges = analysis.topics
          .map((t) => ({
            topicId: slugToId.get(t.slug),
            confidence: t.confidence,
          }))
          .filter((e): e is { topicId: number; confidence: number } =>
            Number.isInteger(e.topicId),
          );
        if (edges.length > 0) {
          await db
            .insert(post_topic)
            .values(
              edges.map((e) => ({
                postId: post.id,
                topicId: e.topicId,
                confidence: e.confidence,
                source: "ai" as const,
              })),
            )
            // A manual edge for the same topic wins — keep it.
            .onConflictDoNothing();
        }

        // Record model-proposed topics as pending for admin approval.
        if (analysis.proposedTopics.length > 0) {
          const inserted = await db
            .insert(topic)
            .values(
              analysis.proposedTopics.map((slug) => ({
                slug,
                label: titleCase(slug),
                status: "pending" as const,
              })),
            )
            .onConflictDoNothing()
            .returning({ id: topic.id });
          proposed += inserted.length;
        }
      }

      analyzed += 1;
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return { analyzed, flagged, proposed };
}

async function reviewComments(): Promise<{
  moderated: number;
  flagged: number;
}> {
  const now = new Date().toISOString();

  const worklist = await db
    .select({ id: comments.id, body: comments.body })
    .from(comments)
    .where(
      and(
        isNull(comments.deletedAt),
        or(
          isNull(comments.moderatedAt),
          gt(comments.updatedAt, comments.moderatedAt),
        ),
      ),
    )
    .orderBy(desc(comments.updatedAt))
    .limit(COMMENT_CAP);

  let moderated = 0;
  let flagged = 0;

  for (const comment of worklist) {
    try {
      const verdict = await autoReview({ type: "comment", body: comment.body });
      if (verdict.verdict === "review") {
        const raised = await raiseSystemReport({
          commentId: comment.id,
          category: verdict.category,
          reason: verdict.reason,
        });
        if (raised) flagged += 1;
      }
      await db
        .update(comments)
        .set({ moderatedAt: now })
        .where(eq(comments.id, comment.id));
      moderated += 1;
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return { moderated, flagged };
}

async function sendDigest(summary: {
  postsAnalyzed: number;
  postsFlagged: number;
  commentsModerated: number;
  commentsFlagged: number;
  proposedTopics: number;
}): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [usersRow, postsRow, commentsRow, pendingRow] = await Promise.all([
    db.select({ n: count() }).from(user).where(gt(user.createdAt, since)),
    db.select({ n: count() }).from(posts).where(gt(posts.createdAt, since)),
    db
      .select({ n: count() })
      .from(comments)
      .where(gt(comments.createdAt, since)),
    db
      .select({ n: count() })
      .from(reports)
      .where(eq(reports.status, "pending")),
  ]);
  const newUsers = usersRow[0]?.n ?? 0;
  const newPosts = postsRow[0]?.n ?? 0;
  const newComments = commentsRow[0]?.n ?? 0;
  const pendingReports = pendingRow[0]?.n ?? 0;

  const flagsThisRun = summary.postsFlagged + summary.commentsFlagged;
  const needsAttention = flagsThisRun > 0 || pendingReports > 0;

  // No noise: only email when there's something to act on.
  if (!needsAttention || !env.ADMIN_EMAIL) return false;

  const rows: Array<[string, number]> = [
    ["New users (24h)", newUsers],
    ["New posts (24h)", newPosts],
    ["New comments (24h)", newComments],
    ["Posts analyzed", summary.postsAnalyzed],
    ["Comments moderated", summary.commentsModerated],
    ["Auto-flagged this run", flagsThisRun],
    ["Pending in moderation queue", pendingReports],
    ["New proposed topics", summary.proposedTopics],
  ];

  const htmlMessage = `
    <h2>Codú daily review</h2>
    <p>${flagsThisRun} new auto-flag(s); ${pendingReports} item(s) waiting in the moderation queue.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="border:1px solid #ddd">${label}</td><td style="border:1px solid #ddd"><b>${value}</b></td></tr>`,
        )
        .join("")}
    </table>
    <p><a href="https://www.codu.co/admin/moderation">Open the moderation queue →</a></p>
  `;

  await sendEmail({
    recipient: env.ADMIN_EMAIL,
    subject: `Codú daily review — ${flagsThisRun} new flag(s), ${pendingReports} pending`,
    htmlMessage,
  });
  return true;
}

const AFFINITY_USER_CAP = 500;

// Recompute implicit topic affinity for users who interacted in the last 24h.
async function reviewAffinity(): Promise<{ usersUpdated: number }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const now = Date.now();
  const users = await findRecentlyActiveUsers(db, since, AFFINITY_USER_CAP);
  let usersUpdated = 0;
  for (const userId of users) {
    try {
      await recomputeUserAffinity(db, userId, now);
      usersUpdated += 1;
    } catch (err) {
      Sentry.captureException(err);
    }
  }
  return { usersUpdated };
}

async function loadVocab(): Promise<{
  vocab: TopicVocabEntry[];
  slugToId: Map<string, number>;
}> {
  const rows = await db
    .select({ id: topic.id, slug: topic.slug, label: topic.label })
    .from(topic)
    .where(eq(topic.status, "active"));
  const slugToId = new Map(rows.map((r) => [r.slug, r.id]));
  return {
    vocab: rows.map((r) => ({ slug: r.slug, label: r.label })),
    slugToId,
  };
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
    const { vocab, slugToId } = await loadVocab();
    const postResult = await reviewPosts(vocab, slugToId);
    const commentResult = await reviewComments();
    const affinityResult = await reviewAffinity();

    const summary = {
      postsAnalyzed: postResult.analyzed,
      postsFlagged: postResult.flagged,
      proposedTopics: postResult.proposed,
      commentsModerated: commentResult.moderated,
      commentsFlagged: commentResult.flagged,
      affinityUsersUpdated: affinityResult.usersUpdated,
    };

    const digestSent = await sendDigest(summary);

    return NextResponse.json({
      ok: true,
      bedrock: isBedrockEnabled(),
      ...summary,
      digestSent,
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
