"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Option = { value: string; label: string };

type FilterPillProps = {
  /** Currently-selected option value. */
  value: string;
  options: Option[];
  onChange: (_value: string) => void;
  /** When true, the trigger renders in the "muted" (default) state. */
  isDefault: boolean;
  align?: "left" | "right";
  testId?: string;
  /** Accessible label for the trigger button. */
  label: string;
};

/**
 * Flat, borderless filter trigger that opens a small listbox popover.
 * No icons, no boxed trigger — matches the relaunch filter style.
 */
export function FilterPill({
  value,
  options,
  onChange,
  isDefault,
  align = "left",
  testId,
  label,
}: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-1 text-sm font-medium transition-colors hover:text-fg ${
          open ? "bg-surface text-fg" : isDefault ? "text-muted" : "text-fg"
        }`}
      >
        {current.label}
        <svg
          className="h-3.5 w-3.5 text-faint"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+6px)] z-40 min-w-44 rounded-md border border-strong bg-elevated p-2 shadow-pop ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-accent/10 font-semibold text-accent-soft"
                      : "font-medium text-muted hover:bg-hover hover:text-fg"
                  }`}
                >
                  <span>{option.label}</span>
                  {selected && (
                    <span className="text-[11px]" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type SortOption = "recent" | "trending" | "popular";
type ContentType =
  | "ARTICLE"
  | "LINK"
  | "TIL"
  | "QUESTION"
  | "VIDEO"
  | "DISCUSSION"
  | null;

type TopicOption = { slug: string; title: string };

type Props = {
  sort: SortOption;
  type?: ContentType;
  /** Currently-selected tag slug, or null for "All topics". */
  tag?: string | null;
  /** Popular tags from api.tag.getPopular. */
  topics: TopicOption[];
  onSortChange: (_sort: SortOption) => void;
  onTypeChange?: (_type: ContentType) => void;
  onTagChange: (_tag: string | null) => void;
  onClear: () => void;
  showTypeFilter?: boolean;
};

// URL param uses lowercase; "all" sentinel maps to null (no param).
const typeOptions: Option[] = [
  { value: "all", label: "All types" },
  { value: "article", label: "Articles" },
  { value: "discussion", label: "Discussions" },
  { value: "link", label: "Links" },
  { value: "question", label: "Questions" },
  { value: "til", label: "TIL" },
];

// Only the three sorts the backend supports.
const sortOptions: Option[] = [
  { value: "recent", label: "Recent" },
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
];

const ALL_TOPICS = "all";

const FeedFilters = ({
  sort,
  type,
  tag,
  topics,
  onSortChange,
  onTypeChange,
  onTagChange,
  onClear,
  showTypeFilter = true,
}: Props) => {
  const typeValue = type ? type.toLowerCase() : "all";
  const tagValue = tag ?? ALL_TOPICS;

  const topicOptions: Option[] = [
    { value: ALL_TOPICS, label: "All topics" },
    ...topics.map((t) => ({ value: t.slug, label: t.title })),
  ];

  const isDirty =
    typeValue !== "all" || sort !== "recent" || tagValue !== ALL_TOPICS;

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1"
      data-testid="feed-filters"
    >
      {isDirty && (
        <button
          type="button"
          onClick={onClear}
          className="mr-1 font-mono text-xs text-faint transition-colors hover:text-muted"
        >
          clear
        </button>
      )}

      {showTypeFilter && onTypeChange && (
        <FilterPill
          testId="type-filter"
          label="Filter by type"
          value={typeValue}
          options={typeOptions}
          isDefault={typeValue === "all"}
          align="right"
          onChange={(next) =>
            onTypeChange(
              next === "all" ? null : (next.toUpperCase() as ContentType),
            )
          }
        />
      )}

      <FilterPill
        testId="sort-filter"
        label="Sort feed"
        value={sort}
        options={sortOptions}
        isDefault={sort === "recent"}
        align="right"
        onChange={(next) => onSortChange(next as SortOption)}
      />

      {topics.length > 0 && (
        <FilterPill
          label="Filter by topic"
          value={tagValue}
          options={topicOptions}
          isDefault={tagValue === ALL_TOPICS}
          align="right"
          onChange={(next) => onTagChange(next === ALL_TOPICS ? null : next)}
        />
      )}
    </div>
  );
};

export default FeedFilters;
