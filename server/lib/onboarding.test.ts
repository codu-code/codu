import { describe, it, expect } from "vitest";
import { isOnboardingComplete } from "./onboarding";

// Onboarding completion is decided server-side from real completion state —
// NOT client localStorage. This pure helper is the single source of truth for
// the feed banner's steps; the reward badge (onboarding_complete) and its
// celebration are owned by checkBadges + the uncelebrated-badge flow.

describe("isOnboardingComplete", () => {
  it("is true only when all three steps are done", () => {
    expect(
      isOnboardingComplete({
        pickedTopics: true,
        followedThree: true,
        commented: true,
      }),
    ).toBe(true);
  });

  it.each([
    { pickedTopics: false, followedThree: true, commented: true },
    { pickedTopics: true, followedThree: false, commented: true },
    { pickedTopics: true, followedThree: true, commented: false },
    { pickedTopics: false, followedThree: false, commented: false },
  ])("is false when a step is missing (%o)", (wins) => {
    expect(isOnboardingComplete(wins)).toBe(false);
  });
});
