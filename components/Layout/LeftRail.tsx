"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Session } from "next-auth";
import { api } from "@/server/trpc/react";
import { Tag } from "@/components/ds";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

const FOOTER = [
  { name: "Privacy", href: "/privacy" },
  { name: "Code of conduct", href: "/code-of-conduct" },
  { name: "Advertise", href: "/advertise" },
  { name: "About", href: "/about" },
];

interface LeftRailProps {
  session: Session | null;
  username: string | null;
}

/**
 * The left rail: primary nav, "Your topics" tags, and a bottom-pinned footer of
 * mono info-page links. Mirrors ui_kits/app/AppShell.jsx → LeftRail.
 */
export function LeftRail({ session, username }: LeftRailProps) {
  const pathname = usePathname();

  const nav = [
    { name: "Home", href: "/" },
    { name: "Discussions", href: "/discussions" },
    { name: "Jobs", href: "/jobs" },
    ...(session
      ? [
          { name: "Notifications", href: "/notifications" },
          { name: "Saved", href: "/saved" },
          { name: "Profile", href: `/${username || "settings"}` },
        ]
      : []),
  ];

  const { openTopics } = useShellActions();
  const { data: popularData } = api.tag.getPopular.useQuery({ limit: 3 });
  const popular = popularData?.data ?? [];
  const { data: interestsData } = api.profile.myInterests.useQuery(undefined, {
    enabled: !!session,
  });
  const myTopics = interestsData?.topics ?? [];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <aside className="app-leftrail">
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm transition-colors duration-base ease-out ${
                active
                  ? "bg-surface font-semibold text-fg"
                  : "font-medium text-muted hover:bg-elevated hover:text-fg"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Your topics — the member's chosen topics (editable), or popular tags
          for logged-out visitors. */}
      {session ? (
        <div className="mt-5 px-3">
          <div className="flex items-center justify-between gap-2">
            <p className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Your topics
            </p>
            <button
              onClick={openTopics}
              className="font-mono text-[10px] text-faint transition-colors hover:text-accent-soft"
            >
              Edit
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {myTopics.length > 0 ? (
              myTopics.slice(0, 6).map((t) => <Tag key={t}>{t}</Tag>)
            ) : (
              <button
                onClick={openTopics}
                className="font-mono text-xs text-accent-soft hover:underline"
              >
                + Add topics
              </button>
            )}
          </div>
        </div>
      ) : (
        popular.length > 0 && (
          <div className="mt-5 px-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Popular topics
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {popular.map((t) => (
                <Link key={t.slug ?? t.title} href={`/?tag=${t.slug}`}>
                  <Tag>{t.title}</Tag>
                </Link>
              ))}
            </div>
          </div>
        )
      )}

      <div className="app-leftrail-footer flex flex-col items-start gap-1.5 px-3">
        {FOOTER.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="font-mono text-[11px] leading-normal text-faint transition-colors hover:text-muted"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
