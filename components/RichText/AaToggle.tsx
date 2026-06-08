"use client";

/**
 * Formatting-toolbar toggle. Lives in composer footers, not in the toolbar.
 * On = accent-bordered wash; off = hairline outline.
 */
export function AaToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={on ? "Hide formatting toolbar" : "Show formatting toolbar"}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
      className={`flex h-[30px] w-[38px] items-center justify-center rounded-md border font-display text-sm font-bold leading-none transition-colors ${
        on
          ? "bg-accent/12 border-accent text-accent-soft"
          : "border-hairline bg-transparent text-faint hover:text-muted"
      }`}
    >
      Aa
    </button>
  );
}
