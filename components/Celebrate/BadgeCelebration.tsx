"use client";

import { useEffect, useState } from "react";
import { api } from "@/server/trpc/react";
import { Confetti } from "./Confetti";
import { BadgeUnlock } from "./BadgeUnlock";

type ActiveBadge = {
  userBadgeId: string;
  name: string;
  emoji: string | null;
};

/**
 * App-wide badge celebration. Mounted in the authed shell so every newly
 * earned badge (onboarding, first post, streaks, points…) fires confetti
 * wherever the user is. Trigger is server-truth (user_badge.celebratedAt is
 * null); each badge is marked celebrated the moment it's shown, so it never
 * re-fires across refreshes/devices. Multiple new badges celebrate one at a
 * time, oldest first.
 */
export function BadgeCelebration({ username }: { username: string | null }) {
  const { data } = api.engagement.uncelebratedBadges.useQuery();
  const utils = api.useUtils();
  const { mutate } = api.engagement.markBadgeCelebrated.useMutation({
    onSuccess: () => {
      // Refetch so the next uncelebrated badge (if any) queues up after close.
      void utils.engagement.uncelebratedBadges.invalidate();
    },
  });

  const [active, setActive] = useState<ActiveBadge | null>(null);
  // Badges already shown this session — keeps the queue moving even before
  // the markBadgeCelebrated refetch lands.
  const [seenIds, setSeenIds] = useState<ReadonlySet<string>>(new Set());

  // Adjust-during-render: promote the oldest unseen badge into the dialog.
  // `active` latches it open until closed; the mutation effect below persists.
  const next = data?.find((b) => !seenIds.has(b.userBadgeId)) ?? null;
  if (!active && next) {
    setActive({
      userBadgeId: next.userBadgeId,
      name: next.name,
      emoji: next.emoji,
    });
    setSeenIds((prev) => new Set(prev).add(next.userBadgeId));
  }

  // Persist the celebration as soon as a badge is shown (server-truth
  // fire-once across refreshes/devices).
  useEffect(() => {
    if (active) {
      mutate({ userBadgeId: active.userBadgeId });
    }
  }, [active, mutate]);

  if (!active) return null;

  return (
    <>
      <Confetti />
      <BadgeUnlock
        badgeName={active.name}
        emoji={active.emoji}
        username={username}
        onClose={() => setActive(null)}
      />
    </>
  );
}
