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
 * Whether the first-win celebration should fire for this user right now.
 * Server-truth: every step complete AND the reward badge actually earned AND
 * not yet celebrated.
 *
 * `firstBadgeEarned` guards against promising a badge we can't show: a post can
 * be created (so `posted` is true) but held in moderation review, in which case
 * the `first_post` badge isn't awarded until approval. Gating on the real badge
 * keeps the celebration in lockstep with the Achievements tab.
 *
 * `firstWinCelebratedAt` is the persisted timestamp (null/undefined = never
 * celebrated), so the celebration survives refresh / new devices and never
 * re-fires.
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
