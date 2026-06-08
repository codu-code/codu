"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  session: Session | null;
  username: string | null;
}

/**
 * Slide-out left drawer that replaces the left rail on ≤720px (opened by the
 * top-bar hamburger). Mirrors LeftRail's contents — nav, "Your topics", and the
 * info-page footer — and closes on backdrop click, Esc, or any nav action.
 * Mirrors ui_kits/app/AppShell.jsx → NavDrawer.
 */
export function NavDrawer({ open, onClose, session, username }: NavDrawerProps) {
  const pathname = usePathname();
  const { openTopics } = useShellActions();

  const { data: interestsData } = api.profile.myInterests.useQuery(undefined, {
    enabled: !!session && open,
  });
  const myTopics = interestsData?.topics ?? [];

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const nav = [
    { name: "Home", href: "/feed" },
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

  const isActive = (href: string) =>
    href === "/feed"
      ? pathname === "/feed" || pathname === "/"
      : pathname?.startsWith(href);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: "rgba(4,5,7,0.6)" }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute bottom-0 left-0 top-0 flex w-[min(286px,84vw)] flex-col overflow-y-auto border-r border-strong bg-elevated px-3 pb-5 pt-4 shadow-lg"
        style={{
          transform: "translateX(0)",
          transition: "transform 320ms ease-out",
        }}
      >
        <div className="flex items-center justify-between px-2.5 pb-4">
          <Link href="/feed" aria-label="Codú — home" onClick={onClose}>
            <Image
              src="/images/codu.png"
              alt="Codú"
              height={16}
              width={64}
              className="dark:invert-0"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="font-mono text-base leading-none text-faint hover:text-muted"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
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

        {session && (
          <div className="mt-5 px-3">
            <div className="flex items-center justify-between gap-2">
              <p className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.18em] text-faint">
                Your topics
              </p>
              <button
                onClick={() => {
                  onClose();
                  openTopics();
                }}
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
                  onClick={() => {
                    onClose();
                    openTopics();
                  }}
                  className="font-mono text-xs text-accent-soft hover:underline"
                >
                  + Add topics
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col items-start gap-1.5 px-3 pt-6">
          {FOOTER.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className="font-mono text-[11px] leading-normal text-faint transition-colors hover:text-muted"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
