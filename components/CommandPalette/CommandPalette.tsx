"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/server/trpc/react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS: { label: string; href: string }[] = [
  { label: "Go to Feed", href: "/feed" },
  { label: "Browse Discussions", href: "/discussions" },
  { label: "Find a job", href: "/jobs" },
  { label: "Write a post", href: "/create" },
  { label: "Saved", href: "/saved" },
  { label: "Notifications", href: "/notifications" },
  { label: "Settings", href: "/settings" },
];

/**
 * ⌘K command palette: site-wide search + quick nav. Grouped Quick actions
 * (filtered by query) + live Tag results. Mirrors ui_kits/app/AppShell.jsx →
 * CommandPalette. (Posts/People search via Algolia is a future enhancement.)
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const query = q.trim();

  const { data: tagData } = api.tag.search.useQuery(
    { query, limit: 5 },
    { enabled: open && query.length > 0 },
  );
  const tags = tagData?.data ?? [];

  if (!open) return null;

  const ql = query.toLowerCase();
  const actions = ql
    ? QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(ql))
    : QUICK_ACTIONS;

  const go = (href: string) => {
    router.push(href);
    setQ("");
    onClose();
  };

  const hasResults = actions.length > 0 || tags.length > 0;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center px-6 pb-6 pt-[11vh]"
      style={{ background: "rgba(4,5,7,0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search Codú"
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-strong bg-elevated shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
          <span className="text-lg leading-none text-faint">⌕</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search actions, tags…"
            className="flex-1 bg-transparent text-lg text-fg outline-none placeholder:text-faint"
          />
          <kbd className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[11px] text-faint">
            Esc
          </kbd>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-3">
          {!hasResults && (
            <div className="p-8 text-center font-mono text-sm text-faint">
              {"// "}no matches for “{query}”
            </div>
          )}

          {actions.length > 0 && (
            <Group label={ql ? "Actions" : "Quick actions"}>
              {actions.map((a) => (
                <Row key={a.label} onClick={() => go(a.href)} glyph="›">
                  {a.label}
                </Row>
              ))}
            </Group>
          )}

          {tags.length > 0 && (
            <Group label="Tags">
              {tags.map((t) => (
                <Row
                  key={t.slug}
                  onClick={() => go(`/feed?tag=${t.slug}`)}
                  glyph="#"
                  sub={`${t.postCount ?? 0} posts`}
                >
                  {t.title}
                </Row>
              ))}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({
  onClick,
  glyph,
  sub,
  children,
}: {
  onClick: () => void;
  glyph: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-surface"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-hairline font-mono text-[13px] text-faint">
        {glyph}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">
          {children}
        </span>
        {sub && (
          <span className="block font-mono text-xs text-faint">{sub}</span>
        )}
      </span>
    </button>
  );
}
