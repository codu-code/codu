"use client";

import Link from "next/link";
import { type Session } from "next-auth";

const MODES: { label: string; href: string }[] = [
  { label: "Tip", href: "/create?kind=til" },
  { label: "Ask", href: "/create?kind=question" },
  { label: "Share a link", href: "/create?kind=link" },
  { label: "Write article", href: "/create" },
];

/**
 * Low-bar composer: a prompt + mode chips (Tip / Ask / Share / Write). Lowering
 * the bar to contribute is a core north star — tips & questions, not just long
 * articles. Mirrors ui_kits/app/Feed.jsx → Composer.
 */
export function Composer({ session }: { session: Session | null }) {
  if (!session?.user) return null;
  const initial = session.user.name?.charAt(0).toUpperCase() || "C";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center gap-3">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-9 w-9 rounded-full object-cover ring-2 ring-hairline"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-on-accent">
            {initial}
          </span>
        )}
        <Link
          href="/create"
          className="flex-1 text-muted transition-colors hover:text-fg"
        >
          What did you learn or build today?
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3">
        {MODES.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="whitespace-nowrap rounded-full border border-hairline px-3 py-1 font-mono text-xs text-muted transition-colors hover:border-strong hover:text-fg"
          >
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
