"use client";

import { api } from "@/server/trpc/react";

/**
 * Personal daily-activity streak. Render only for signed-in users (the query is
 * protected). Hidden until the user has a streak.
 */
export function StreakBadge() {
  const { data } = api.engagement.myStats.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!data || data.currentStreak < 1) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-1 font-mono text-xs text-fg"
      title={`${data.currentStreak}-day streak · ${data.points} points`}
    >
      <span aria-hidden>🔥</span>
      {data.currentStreak}
    </span>
  );
}
