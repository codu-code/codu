/**
 * Pure decision logic for the "first win" onboarding moment. Kept free of `db`
 * and `next/headers` imports so both the tRPC layer and unit tests can use it
 * without booting the env/db layer.
 */

/** Real completion state of the three onboarding steps. */
export interface OnboardingWins {
  /** Picked at least one topic ("Your topics"). */
  pickedTopics: boolean;
  /** Followed three or more builders. */
  followedThree: boolean;
  /** Published at least one post. */
  posted: boolean;
}

/** True once every onboarding step is done. */
export function isOnboardingComplete(wins: OnboardingWins): boolean {
  return wins.pickedTopics && wins.followedThree && wins.posted;
}

/**
 * Whether the first-win celebration should fire now: every step complete, the
 * reward badge actually earned, and not yet celebrated.
 *
 * `firstBadgeEarned` guards against promising a badge we can't show — a post can
 * be `posted` but held in review, so the `first_post` badge isn't awarded yet.
 * `firstWinCelebratedAt` (persisted; null = never) makes it survive refresh /
 * new devices and never re-fire.
 */
export function shouldCelebrateFirstWin(
  wins: OnboardingWins,
  firstBadgeEarned: boolean,
  firstWinCelebratedAt: string | Date | null | undefined,
): boolean {
  return (
    isOnboardingComplete(wins) && firstBadgeEarned && !firstWinCelebratedAt
  );
}
