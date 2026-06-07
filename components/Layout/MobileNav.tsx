"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { type Session } from "next-auth";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

/**
 * Bottom nav for small screens (≤720px), where the top-bar nav is absent and
 * the left rail is hidden. Keeps the primary destinations + Create reachable on
 * mobile. Shown via the `.app-mobilenav` media query in globals.css.
 */
export function MobileNav({
  session,
  username,
}: {
  session: Session | null;
  username: string | null;
}) {
  const pathname = usePathname();
  const { openCompose } = useShellActions();

  const items = session
    ? [
        { name: "Home", href: "/feed" },
        { name: "Discuss", href: "/discussions" },
        { name: "Jobs", href: "/jobs" },
        { name: "Alerts", href: "/notifications" },
        { name: "You", href: `/${username || "settings"}` },
      ]
    : [
        { name: "Home", href: "/feed" },
        { name: "Discuss", href: "/discussions" },
        { name: "Jobs", href: "/jobs" },
      ];

  const isActive = (href: string) =>
    href === "/feed"
      ? pathname === "/feed" || pathname === "/"
      : pathname?.startsWith(href);

  return (
    <nav className="app-mobilenav" aria-label="Primary">
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex flex-1 items-center justify-center py-2 text-xs font-medium transition-colors ${
            isActive(item.href) ? "text-fg" : "text-muted"
          }`}
        >
          {item.name}
        </Link>
      ))}
      {session ? (
        <button
          onClick={() => openCompose("discussion")}
          aria-label="Create a post"
          className="flex flex-1 items-center justify-center py-2 text-xs font-semibold text-accent"
        >
          + Create
        </button>
      ) : (
        <button
          onClick={() => signIn()}
          className="flex flex-1 items-center justify-center py-2 text-xs font-semibold text-accent"
        >
          Join
        </button>
      )}
    </nav>
  );
}
