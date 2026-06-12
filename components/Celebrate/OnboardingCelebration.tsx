"use client";

import { useEffect, useState } from "react";
import { api } from "@/server/trpc/react";
import { Confetti } from "./Confetti";
import { BadgeUnlock } from "./BadgeUnlock";

/**
 * App-wide first-win celebration. Mounted in the authed shell so it fires
 * wherever the user finishes their last onboarding step (not just the feed).
 * Trigger is server-truth (`onboardingWins.celebrate`); on fire we persist via
 * `markFirstWinCelebrated` so it never re-fires across refreshes/devices.
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

  // Fire-once: persist when the server says to celebrate. The mutation's status
  // (no longer idle) latches the dialog open even after `celebrate` flips false.
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
        // Prefer server-truth username over the (possibly stale) SSR-threaded prop.
        username={data?.username ?? username}
        onClose={() => setClosed(true)}
      />
    </>
  );
}
