import { describe, it, expect } from "vitest";
import {
  recencyComponent,
  qualityComponent,
  affinityComponent,
  isMuted,
  scoreCandidate,
  rankCandidates,
  hasProfileSignal,
  RECENCY_HALFLIFE_HOURS,
  type UserProfile,
  type FeedCandidate,
} from "./feedRanking";

const NOW = Date.parse("2026-06-14T00:00:00.000Z");

function emptyProfile(): UserProfile {
  return { affinity: new Map(), follows: new Set(), mutes: new Set() };
}

function candidate(over: Partial<FeedCandidate> = {}): FeedCandidate {
  return {
    id: "p1",
    publishedAt: new Date(NOW).toISOString(),
    score: 0,
    qualityScore: null,
    topicIds: [],
    ...over,
  };
}

describe("recencyComponent", () => {
  it("is 1 for a just-published post", () => {
    expect(recencyComponent(new Date(NOW).toISOString(), NOW)).toBeCloseTo(1);
  });
  it("halves after one half-life", () => {
    const older = NOW - RECENCY_HALFLIFE_HOURS * 3_600_000;
    expect(recencyComponent(new Date(older).toISOString(), NOW)).toBeCloseTo(
      0.5,
    );
  });
  it("is 0 for null or unparseable timestamps", () => {
    expect(recencyComponent(null, NOW)).toBe(0);
    expect(recencyComponent("not-a-date", NOW)).toBe(0);
  });
});

describe("qualityComponent", () => {
  it("log-damps votes and adds the AI quality score", () => {
    expect(
      qualityComponent(candidate({ score: 9, qualityScore: 0.5 })),
    ).toBeCloseTo(Math.log10(10) + 0.5);
  });
  it("never goes negative on downvoted posts and treats null quality as 0", () => {
    expect(qualityComponent(candidate({ score: -5, qualityScore: null }))).toBe(
      0,
    );
  });
});

describe("affinityComponent", () => {
  it("sums explicit follow boosts and implicit affinity over the post's topics", () => {
    const profile = emptyProfile();
    profile.follows.add(1);
    profile.affinity.set(1, 2).set(2, 0.5);
    // topic 1: follow(1) + affinity(2) = 3; topic 2: affinity(0.5)
    expect(affinityComponent([1, 2], profile)).toBeCloseTo(3.5);
  });
  it("is 0 when the post shares no topics with the profile", () => {
    const profile = emptyProfile();
    profile.affinity.set(99, 5);
    expect(affinityComponent([1, 2], profile)).toBe(0);
  });
});

describe("isMuted / scoreCandidate", () => {
  it("filters a post that has any muted topic (returns null)", () => {
    const profile = emptyProfile();
    profile.mutes.add(7);
    expect(isMuted([3, 7], profile)).toBe(true);
    expect(
      scoreCandidate(candidate({ topicIds: [3, 7] }), profile, NOW),
    ).toBeNull();
  });
  it("scores a non-muted post as the weighted blend", () => {
    const profile = emptyProfile();
    profile.follows.add(1);
    const c = candidate({ topicIds: [1], score: 9, qualityScore: 0 });
    // recency 1*1 + quality 0.5*log10(10) + affinity 1.5*1
    const expected = 1 * 1 + 0.5 * Math.log10(10) + 1.5 * 1;
    expect(scoreCandidate(c, profile, NOW)).toBeCloseTo(expected);
  });
});

describe("rankCandidates", () => {
  it("drops muted posts and sorts by score descending", () => {
    const profile = emptyProfile();
    profile.follows.add(1);
    profile.mutes.add(9);
    const items = [
      candidate({ id: "muted", topicIds: [9] }),
      candidate({ id: "plain", topicIds: [] }),
      candidate({ id: "followed", topicIds: [1] }),
    ];
    const ranked = rankCandidates(items, profile, NOW);
    expect(ranked.map((r) => r.item.id)).toEqual(["followed", "plain"]);
  });

  it("breaks score ties by newest publishedAt", () => {
    const profile = emptyProfile();
    const newer = candidate({
      id: "newer",
      publishedAt: new Date(NOW).toISOString(),
    });
    const older = candidate({
      id: "older",
      publishedAt: new Date(NOW - 3_600_000).toISOString(),
    });
    const ranked = rankCandidates([older, newer], profile, NOW);
    expect(ranked.map((r) => r.item.id)).toEqual(["newer", "older"]);
  });
});

describe("hasProfileSignal", () => {
  it("is false for a cold-start (empty) profile and true with any signal", () => {
    expect(hasProfileSignal(emptyProfile())).toBe(false);
    const p = emptyProfile();
    p.affinity.set(1, 0.1);
    expect(hasProfileSignal(p)).toBe(true);
  });
});
