"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Session } from "next-auth";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon,
  BellIcon,
  BookmarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { Tag } from "@/components/ds";

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
    { name: "Home", href: "/feed", icon: HomeIcon },
    { name: "Discussions", href: "/discussions", icon: ChatBubbleLeftRightIcon },
    { name: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    ...(session
      ? [
          { name: "Notifications", href: "/notifications", icon: BellIcon },
          { name: "Saved", href: "/saved", icon: BookmarkIcon },
          {
            name: "Profile",
            href: `/${username || "settings"}`,
            icon: UserIcon,
          },
        ]
      : []),
  ];

  const { data: popularData } = api.tag.getPopular.useQuery({ limit: 3 });
  const popular = popularData?.data ?? [];

  const isActive = (href: string) =>
    href === "/feed"
      ? pathname === "/feed" || pathname === "/"
      : pathname?.startsWith(href);

  return (
    <aside className="app-leftrail">
      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface font-semibold text-fg"
                  : "font-medium text-muted hover:bg-elevated hover:text-fg"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {popular && popular.length > 0 && (
        <div className="mt-5 px-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">
            Your topics
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.map((t) => (
              <Link key={t.slug} href={`/feed?tag=${t.slug}`}>
                <Tag>{t.title}</Tag>
              </Link>
            ))}
          </div>
        </div>
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
