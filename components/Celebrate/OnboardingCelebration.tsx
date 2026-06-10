"use client";

import { useEffect, useState } from "react";
import { api } from "@/server/trpc/react";
import { Confetti } from "./Confetti";
import { BadgeUnlock } from "./BadgeUnlock";

/**
 * App-wide first-win celebration. Mounted in the authed shell (not the feed) so
 * it fires wherever the user finishes their last onboarding step — picking
 * topics, following three builders, or posting their first tip can all happen
 * off the feed. The trigger is server-truth: `engagement.onboardingWins.celebrate`
 * is true only when all three steps are done AND the user has never celebrated.
 *
 * On fire we immediately persist via `markFirstWinCelebrated` (idempotent) so it
 * never re-fires across refreshes or devices, then show the confetti + badge.
 * Reduced-motion users still get the badge dialog — the reward is information.
 */
export function OnboardingCelebration({
  username,
}: {
  username: string | null;
}) {
  const { data } = api.engagement.onboardingWins.useQuery();
  const utils = api.useUtils();
  const { mutate, isIdle } = api.engagement.markFirstWinCelebrated.useMutation({
    onSuccess: () => {
      // Refetch so `celebrate` flips false everywhere it's read.
      void utils.engagement.onboardingWins.invalidate();
    },
  });

  const [closed, setClosed] = useState(false);

  // Fire-once: persist the moment the server says to celebrate. Firing the
  // mutation is an external-system update, so it belongs in an effect; the
  // mutation's own status (no longer idle) latches the dialog open even after
  // the persist flips `celebrate` back to false on refetch.
  useEffect(() => {
    if (data?.celebrate && isIdle) {
      mutate();
    }
  }, [data?.celebrate, isIdle, mutate]);

  const open = (data?.celebrate || !isIdle) && !closed;
  if (!open) return null;

  return (
    <>
      <Confetti />
      <BadgeUnlock
        badgeName="First Post"
        points={20}
        // Prefer the server-truth username (current) over the SSR-threaded prop,
        // which can be stale if the handle was set later in the same session.
        username={data?.username ?? username}
        onClose={() => setClosed(true)}
      />
    </>
  );
}
