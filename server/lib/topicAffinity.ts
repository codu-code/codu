import { desc, eq, gt, inArray } from "drizzle-orm";
import type { db as defaultDb } from "@/server/db";
import {
  post_votes,
  bookmarks,
  comments,
  post_topic,
  user_topic_affinity,
} from "@/server/db/schema";

// Implicit topic affinity: how much a user has engaged with each topic, derived
// from their votes/bookmarks/comments via post_topic edges with time decay.

type Db = typeof defaultDb;

export const HALF_LIFE_DAYS = 60;
const MS_PER_DAY = 86_400_000;
const PER_SOURCE_LIMIT = 300;

export const INTERACTION_WEIGHT = {
  upvote: 3,
  downvote: -1,
  bookmark: 4,
  comment: 2,
} as const;

export function decayedWeight(
  base: number,
  ageDays: number,
  halfLifeDays: number = HALF_LIFE_DAYS,
): number {
  if (ageDays <= 0) return base;
  return base * Math.pow(0.5, ageDays / halfLifeDays);
}

interface Interaction {
  postId: string;
  base: number;
  createdAt: string;
}

// Recompute and persist one user's topic affinity, replacing their existing
// rows. Returns the number of topics with positive affinity.
export async function recomputeUserAffinity(
  db: Db,
  userId: string,
  nowMs: number,
): Promise<number> {
  const [votes, marks, cmts] = await Promise.all([
    db
      .select({
        postId: post_votes.postId,
        voteType: post_votes.voteType,
        createdAt: post_votes.createdAt,
      })
      .from(post_votes)
      .where(eq(post_votes.userId, userId))
      .orderBy(desc(post_votes.createdAt))
      .limit(PER_SOURCE_LIMIT),
    db
      .select({ postId: bookmarks.postId, createdAt: bookmarks.createdAt })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(PER_SOURCE_LIMIT),
    db
      .select({ postId: comments.postId, createdAt: comments.createdAt })
      .from(comments)
      .where(eq(comments.authorId, userId))
      .orderBy(desc(comments.createdAt))
      .limit(PER_SOURCE_LIMIT),
  ]);

  const interactions: Interaction[] = [
    ...votes.map((v) => ({
      postId: v.postId,
      base:
        v.voteType === "up"
          ? INTERACTION_WEIGHT.upvote
          : INTERACTION_WEIGHT.downvote,
      createdAt: v.createdAt,
    })),
    ...marks.map((m) => ({
      postId: m.postId,
      base: INTERACTION_WEIGHT.bookmark,
      createdAt: m.createdAt,
    })),
    ...cmts.map((c) => ({
      postId: c.postId,
      base: INTERACTION_WEIGHT.comment,
      createdAt: c.createdAt,
    })),
  ];

  if (interactions.length === 0) {
    await db
      .delete(user_topic_affinity)
      .where(eq(user_topic_affinity.userId, userId));
    return 0;
  }

  const postIds = Array.from(new Set(interactions.map((i) => i.postId)));
  const edges = await db
    .select({ postId: post_topic.postId, topicId: post_topic.topicId })
    .from(post_topic)
    .where(inArray(post_topic.postId, postIds));

  const topicsByPost = new Map<string, number[]>();
  for (const edge of edges) {
    const arr = topicsByPost.get(edge.postId) ?? [];
    arr.push(edge.topicId);
    topicsByPost.set(edge.postId, arr);
  }

  const scores = new Map<number, number>();
  for (const it of interactions) {
    const topics = topicsByPost.get(it.postId);
    if (!topics?.length) continue;
    const ageDays = Math.max(
      0,
      (nowMs - Date.parse(it.createdAt)) / MS_PER_DAY,
    );
    const weight = decayedWeight(it.base, ageDays);
    for (const topicId of topics) {
      scores.set(topicId, (scores.get(topicId) ?? 0) + weight);
    }
  }

  const updatedAt = new Date(nowMs).toISOString();
  const rows = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .map(([topicId, score]) => ({ userId, topicId, score, updatedAt }));

  await db
    .delete(user_topic_affinity)
    .where(eq(user_topic_affinity.userId, userId));
  if (rows.length > 0) {
    await db.insert(user_topic_affinity).values(rows);
  }
  return rows.length;
}

// User ids with at least one interaction since `sinceIso`, capped.
export async function findRecentlyActiveUsers(
  db: Db,
  sinceIso: string,
  limit: number,
): Promise<string[]> {
  const [voters, markers, commenters] = await Promise.all([
    db
      .selectDistinct({ userId: post_votes.userId })
      .from(post_votes)
      .where(gt(post_votes.createdAt, sinceIso)),
    db
      .selectDistinct({ userId: bookmarks.userId })
      .from(bookmarks)
      .where(gt(bookmarks.createdAt, sinceIso)),
    db
      .selectDistinct({ userId: comments.authorId })
      .from(comments)
      .where(gt(comments.createdAt, sinceIso)),
  ]);

  const ids = new Set<string>();
  for (const row of voters) ids.add(row.userId);
  for (const row of markers) ids.add(row.userId);
  for (const row of commenters) ids.add(row.userId);
  return Array.from(ids).slice(0, limit);
}
