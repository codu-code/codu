// Feed personalization scoring. The score is a weighted sum of named components
// (recency, quality, affinity) so a post's ranking is always explainable. Pure
// and deterministic — time is passed in — so it's unit-testable without a DB.

export interface RankingWeights {
  recency: number;
  quality: number;
  affinity: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  recency: 1,
  quality: 0.5,
  affinity: 1.5,
};

export const RECENCY_HALFLIFE_HOURS = 48;

export interface FeedCandidate {
  id: string;
  publishedAt: string | null;
  score: number; // upvotes - downvotes
  qualityScore: number | null; // AI quality in [0,1], or null
  topicIds: number[];
}

export interface UserProfile {
  affinity: Map<number, number>;
  follows: Set<number>;
  mutes: Set<number>;
}

export function recencyComponent(
  publishedAt: string | null,
  nowMs: number,
): number {
  if (!publishedAt) return 0;
  const publishedMs = Date.parse(publishedAt);
  if (Number.isNaN(publishedMs)) return 0;
  const ageHours = Math.max(0, (nowMs - publishedMs) / 3_600_000);
  return Math.pow(0.5, ageHours / RECENCY_HALFLIFE_HOURS);
}

export function qualityComponent(candidate: FeedCandidate): number {
  // Log-damp votes so a viral post can't dominate on raw count alone.
  const voteSignal = Math.log10(Math.max(0, candidate.score) + 1);
  return voteSignal + (candidate.qualityScore ?? 0);
}

export function affinityComponent(
  topicIds: number[],
  profile: UserProfile,
): number {
  let total = 0;
  for (const topicId of topicIds) {
    if (profile.follows.has(topicId)) total += 1;
    total += profile.affinity.get(topicId) ?? 0;
  }
  return total;
}

export function isMuted(topicIds: number[], profile: UserProfile): boolean {
  return topicIds.some((topicId) => profile.mutes.has(topicId));
}

// Returns null when the post should be hidden (a muted topic).
export function scoreCandidate(
  candidate: FeedCandidate,
  profile: UserProfile,
  nowMs: number,
  weights: RankingWeights = DEFAULT_WEIGHTS,
): number | null {
  if (isMuted(candidate.topicIds, profile)) return null;
  return (
    weights.recency * recencyComponent(candidate.publishedAt, nowMs) +
    weights.quality * qualityComponent(candidate) +
    weights.affinity * affinityComponent(candidate.topicIds, profile)
  );
}

export interface RankedCandidate<T extends FeedCandidate> {
  item: T;
  score: number;
}

// Drop muted posts, score the rest, sort by score with a newest-first tiebreak
// so pagination is deterministic.
export function rankCandidates<T extends FeedCandidate>(
  candidates: T[],
  profile: UserProfile,
  nowMs: number,
  weights: RankingWeights = DEFAULT_WEIGHTS,
): RankedCandidate<T>[] {
  const ranked: RankedCandidate<T>[] = [];
  for (const item of candidates) {
    const score = scoreCandidate(item, profile, nowMs, weights);
    if (score !== null) ranked.push({ item, score });
  }
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.item.publishedAt ? Date.parse(a.item.publishedAt) : 0;
    const bt = b.item.publishedAt ? Date.parse(b.item.publishedAt) : 0;
    if (bt !== at) return bt - at;
    return a.item.id < b.item.id ? 1 : -1;
  });
  return ranked;
}

export function hasProfileSignal(profile: UserProfile): boolean {
  return (
    profile.follows.size > 0 ||
    profile.mutes.size > 0 ||
    profile.affinity.size > 0
  );
}
