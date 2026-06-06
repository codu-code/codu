"use client";

import Link from "next/link";
import Image from "next/image";
import { api } from "@/server/trpc/react";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import { Eyebrow } from "./Eyebrow";

/**
 * Build Board — weekly leaderboard of the most active builders.
 * Flag-gated AND hidden while empty (no ghost-town leaderboards).
 */
export function BuildBoard({ className }: { className?: string }) {
  const enabled = isFlagEnabled(FEATURE_FLAGS.BUILD_BOARD);
  const { data } = api.engagement.leaderboard.useQuery(
    { window: "week", limit: 5 },
    { enabled },
  );

  if (!enabled || !data || data.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-hairline bg-surface p-4 ${className ?? ""}`}
    >
      <Eyebrow>build board · this week</Eyebrow>
      <ol className="mt-4 space-y-3">
        {data.map((u, i) => (
          <li key={u.userId} className="flex items-center gap-3">
            <span className="w-4 font-mono text-xs text-faint">{i + 1}</span>
            <Image
              src={u.image || "/images/person.png"}
              width={28}
              height={28}
              alt={u.name || u.username || "builder"}
              className="h-7 w-7 rounded-full object-cover"
            />
            <Link
              href={`/${u.username}`}
              className="flex-1 truncate text-sm font-medium text-fg hover:text-accent"
            >
              {u.name || u.username}
            </Link>
            <span className="font-mono text-xs text-accent">{u.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
