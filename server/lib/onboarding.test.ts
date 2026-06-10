import { describe, it, expect } from "vitest";
import { isOnboardingComplete, shouldCelebrateFirstWin } from "./onboarding";

// The first-win celebration is decided server-side from real completion + a
// persisted "already celebrated" timestamp — NOT client localStorage. These
// pure helpers are the single source of truth for both the feed banner (steps)
// and the app-wide celebration trigger, so they're exercised in isolation here.

describe("isOnboardingComplete", () => {
  it("is true only when all three steps are done", () => {
    expect(
      isOnboardingComplete({
        pickedTopics: true,
        followedThree: true,
        posted: true,
      }),
    ).toBe(true);
  });

  it.each([
    { pickedTopics: false, followedThree: true, posted: true },
    { pickedTopics: true, followedThree: false, posted: true },
    { pickedTopics: true, followedThree: true, posted: false },
    { pickedTopics: false, followedThree: false, posted: false },
  ])("is false when a step is missing (%o)", (wins) => {
    expect(isOnboardingComplete(wins)).toBe(false);
  });
});

describe("shouldCelebrateFirstWin", () => {
  const allDone = { pickedTopics: true, followedThree: true, posted: true };

  it("celebrates when complete, badge earned, and never celebrated before", () => {
    expect(shouldCelebrateFirstWin(allDone, true, null)).toBe(true);
  });

  it("does not celebrate when onboarding is incomplete", () => {
    expect(
      shouldCelebrateFirstWin({ ...allDone, posted: false }, true, null),
    ).toBe(false);
  });

  it("does not celebrate a badge the user has not actually earned yet", () => {
    // Posted (raw row exists) but the post is still in review, so the
    // first_post badge isn't awarded — don't promise a reward we can't show.
    expect(shouldCelebrateFirstWin(allDone, false, null)).toBe(false);
  });

  it("does not re-celebrate once a timestamp is persisted", () => {
    // Survives refresh / new device: the persisted flag wins regardless of steps.
    expect(
      shouldCelebrateFirstWin(allDone, true, "2026-06-09T00:00:00.000Z"),
    ).toBe(false);
    expect(shouldCelebrateFirstWin(allDone, true, new Date())).toBe(false);
  });

  it("treats undefined (not-yet-loaded) as not celebrated", () => {
    expect(shouldCelebrateFirstWin(allDone, true, undefined)).toBe(true);
  });
});
