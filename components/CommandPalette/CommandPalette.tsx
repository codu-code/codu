"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/server/trpc/react";

interface CommandPaletteProps {
  onClose: () => void;
}

type Item = {
  id: string;
  label: string;
  href: string;
  group: string;
  sub?: string;
  glyph: string;
};

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
 * ⌘K command palette: site-wide search + quick nav. With a query it shows live
 * results from `api.search.everything` — Posts, People, Tags — debounced ~300ms;
 * with an empty query it falls back to Quick actions. Arrow-key navigation and
 * Enter-to-select run over the combined flat list. Mounted only while open (by
 * AppShell), which keeps state fresh without a reset effect; AppShell restores
 * focus to the trigger on close. Mirrors ui_kits/app/AppShell.jsx → CommandPalette.
 */
export function CommandPalette({ onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);

  // Debounce the raw input into `debounced` ~300ms after the user stops typing.
  // setState lives inside the timeout (async), satisfying set-state-in-effect.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const hasQuery = debounced.length >= 2;
  const { data: results, isFetching } = api.search.everything.useQuery(
    { query: debounced, limit: 5 },
    { enabled: hasQuery },
  );

  const items = useMemo<Item[]>(() => {
    if (hasQuery) {
      const postItems: Item[] = (results?.posts ?? []).map((p) => ({
        id: `p:${p.id}`,
        label: p.title,
        href: p.href,
        group: "Posts",
        sub: `${p.upvotes ?? 0} upvotes`,
        glyph: "▲",
      }));
      const peopleItems: Item[] = (results?.people ?? []).map((u) => ({
        id: `u:${u.username}`,
        label: u.name ?? u.username,
        href: `/${u.username}`,
        group: "People",
        sub: `@${u.username}`,
        glyph: "@",
      }));
      const tagItems: Item[] = (results?.tags ?? []).map((t) => ({
        id: `t:${t.slug}`,
        label: t.title,
        href: `/feed?tag=${t.slug}`,
        group: "Tags",
        sub: `${t.postCount ?? 0} posts`,
        glyph: "#",
      }));
      return [...postItems, ...peopleItems, ...tagItems];
    }
    return QUICK_ACTIONS.map((a) => ({
      id: `a:${a.href}`,
      label: a.label,
      href: a.href,
      group: "Quick actions",
      glyph: "›",
    }));
  }, [hasQuery, results]);

  // Clamp at render rather than in an effect.
  const activeIndex = items.length ? Math.min(active, items.length - 1) : 0;

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(items.length ? (activeIndex + 1) % items.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(
        items.length ? (activeIndex - 1 + items.length) % items.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) go(item.href);
    }
  };

  // Group consecutive items by group label for headers.
  const groups: { label: string; items: Item[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.label === item.group) last.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  let flatIndex = -1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center px-6 pb-6 pt-[11vh]"
      style={{ background: "rgba(4,5,7,0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
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
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Search posts, people, tags…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            className="flex-1 bg-transparent text-lg text-fg outline-none placeholder:text-faint"
          />
          <kbd className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[11px] text-faint">
            Esc
          </kbd>
        </div>

        <div
          id="cmdk-list"
          role="listbox"
          className="max-h-[54vh] overflow-y-auto p-3"
        >
          {items.length === 0 &&
            (hasQuery && isFetching ? (
              <div className="p-8 text-center font-mono text-sm text-faint">
                {"// "}searching…
              </div>
            ) : (
              <div className="p-8 text-center font-mono text-sm text-faint">
                {"// "}no matches for “{debounced}”
              </div>
            ))}

          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="mb-1 px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                {group.label}
              </p>
              {group.items.map((item) => {
                flatIndex += 1;
                const isActive = flatIndex === activeIndex;
                const idx = flatIndex;
                return (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(item.href)}
                    className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                      isActive ? "bg-surface" : ""
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-hairline font-mono text-[13px] text-faint">
                      {item.glyph}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="block font-mono text-xs text-faint">
                          {item.sub}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
