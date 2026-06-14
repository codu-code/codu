import { eq, inArray } from "drizzle-orm";
import type { db as defaultDb } from "@/server/db";
import {
  user_topic_pref,
  user_topic_affinity,
  post_topic,
} from "@/server/db/schema";
import type { UserProfile } from "@/server/lib/feedRanking";

type Db = typeof defaultDb;

// Load a user's prefs + affinity into the ranking module's shape.
export async function loadUserProfile(
  db: Db,
  userId: string,
): Promise<UserProfile> {
  const [prefs, affinity] = await Promise.all([
    db
      .select({ topicId: user_topic_pref.topicId, pref: user_topic_pref.pref })
      .from(user_topic_pref)
      .where(eq(user_topic_pref.userId, userId)),
    db
      .select({
        topicId: user_topic_affinity.topicId,
        score: user_topic_affinity.score,
      })
      .from(user_topic_affinity)
      .where(eq(user_topic_affinity.userId, userId)),
  ]);

  const follows = new Set<number>();
  const mutes = new Set<number>();
  for (const p of prefs) {
    (p.pref === "mute" ? mutes : follows).add(p.topicId);
  }
  const affinityMap = new Map<number, number>();
  for (const a of affinity) affinityMap.set(a.topicId, a.score);

  return { follows, mutes, affinity: affinityMap };
}

// topicIds per post for a candidate window.
export async function loadTopicsByPost(
  db: Db,
  postIds: string[],
): Promise<Map<string, number[]>> {
  const byPost = new Map<string, number[]>();
  if (postIds.length === 0) return byPost;
  const edges = await db
    .select({ postId: post_topic.postId, topicId: post_topic.topicId })
    .from(post_topic)
    .where(inArray(post_topic.postId, postIds));
  for (const e of edges) {
    const arr = byPost.get(e.postId) ?? [];
    arr.push(e.topicId);
    byPost.set(e.postId, arr);
  }
  return byPost;
}
