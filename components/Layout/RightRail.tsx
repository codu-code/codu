"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { type Session } from "next-auth";
import { api } from "@/server/trpc/react";
import { Tag, ConversionHub, NewsletterCapture } from "@/components/ds";

interface RightRailProps {
  session: Session | null;
}

/**
 * The right rail, consistent on every page: your progress (logged in) or a join
 * card (logged out) → trending tags → contribute hub / newsletter.
 * Mirrors ui_kits/app/AppShell.jsx → RightRail.
 */
export function RightRail({ session }: RightRailProps) {
  return (
    <aside className="app-rightrail">
      {session ? <ProgressCard /> : <JoinCard />}
      <TrendingCard />
      {session ? <ConversionHub /> : <NewsletterCapture variant="compact" />}
    </aside>
  );
}

// Points milestones mirror engagement BADGE_RULES (points_100 / points_500).
const MILESTONES = [100, 500, 1000, 2500, 5000];

function ProgressCard() {
  const { data } = api.engagement.myStats.useQuery();
  const points = data?.points ?? 0;
  const streak = data?.currentStreak ?? 0;
  const next = MILESTONES.find((m) => m > points) ?? points;
  const prev = [...MILESTONES].reverse().find((m) => m <= points) ?? 0;
  const pct =
    next > prev
      ? Math.min(100, Math.round(((points - prev) / (next - prev)) * 100))
      : 100;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
          Your progress
        </p>
        <Link
          href="/settings"
          className="font-mono text-xs text-accent-soft hover:text-accent"
        >
          View all ›
        </Link>
      </div>
      <div className="mt-4 flex gap-6">
        <div>
          <div className="font-display text-2xl font-extrabold leading-none">
            {points}
          </div>
          <div className="mt-1 font-mono text-xs text-faint">points</div>
        </div>
        <div>
          <div className="font-display text-2xl font-extrabold leading-none">
            🔥 {streak}
          </div>
          <div className="mt-1 font-mono text-xs text-faint">day streak</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between font-mono text-xs text-faint">
          <span>Next milestone</span>
          <span>
            {points}/{next}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function JoinCard() {
  return (
    <div className="card border-strong p-5">
      <h3 className="font-display text-xl font-extrabold">Join the builders</h3>
      <p className="mb-4 mt-2 text-sm leading-snug text-muted">
        Learn to build with AI, share what you ship, and grow with people doing
        the same. Free to upvote, save, follow, and post — reading stays free.
      </p>
      <button
        onClick={() => signIn()}
        className="primary-button w-full justify-center py-2.5"
      >
        Join free
      </button>
    </div>
  );
}

function TrendingCard() {
  const { data } = api.tag.getPopular.useQuery({ limit: 8 });
  const tags = data?.data ?? [];
  if (tags.length === 0) return null;
  return (
    <div className="card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
        Trending tags
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link key={t.slug ?? t.title} href={`/?tag=${t.slug}`}>
            <Tag>{t.title}</Tag>
          </Link>
        ))}
      </div>
    </div>
  );
}
