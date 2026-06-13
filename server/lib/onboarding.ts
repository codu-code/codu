/**
 * Pure decision logic for the "first win" onboarding moment. Kept free of `db`
 * and `next/headers` imports so both the tRPC layer and unit tests can use it
 * without booting the env/db layer.
 *
 * The reward is the onboarding_complete badge (granted by checkBadges); its
 * celebration runs through the generic uncelebrated-badge flow, so there is no
 * separate first-win celebration trigger here anymore.
 */

/** Real completion state of the three onboarding steps. */
export interface OnboardingWins {
  /** Picked at least one topic ("Your topics"). */
  pickedTopics: boolean;
  /** Followed three or more builders. */
  followedThree: boolean;
  /** Left at least one comment — the deliberate low-bar first contribution
   * (posting stays unearned so the first_post badge teases the next step). */
  commented: boolean;
}

/** True once every onboarding step is done. */
export function isOnboardingComplete(wins: OnboardingWins): boolean {
  return wins.pickedTopics && wins.followedThree && wins.commented;
}
