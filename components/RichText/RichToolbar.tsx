"use client";

import type { MdTool } from "./markdown";

/**
 * One-row markdown toolbar. Buttons insert/wrap markdown around the textarea's
 * selection via `exec`. Every button uses onMouseDown→preventDefault so the
 * textarea keeps its selection when clicked.
 */
interface RichToolbarProps {
  exec: (tool: MdTool) => void;
  onSwitchToMarkdown: () => void;
  /** 28×28 buttons instead of 32×32 (used in the compact discussion editor). */
  compact?: boolean;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

function Divider() {
  return <span className="mx-1 h-[18px] w-px shrink-0 bg-hairline" />;
}

function TBtn({
  label,
  onClick,
  compact,
  children,
}: {
  label: string;
  onClick: () => void;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Keep the textarea selection alive across the click.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-sm bg-transparent text-muted transition-colors hover:bg-hover hover:text-fg ${
        compact ? "h-7 w-7" : "h-8 w-8"
      }`}
    >
      {children}
    </button>
  );
}

export function RichToolbar({
  exec,
  onSwitchToMarkdown,
  compact = false,
}: RichToolbarProps) {
  return (
    <div className="flex flex-nowrap items-center gap-[2px] overflow-x-auto rounded-md border border-hairline bg-canvas px-1.5 py-1">
      {/* 1. Inline */}
      <TBtn label="Bold" onClick={() => exec("bold")} compact={compact}>
        <span className="font-display text-sm font-bold leading-none">B</span>
      </TBtn>
      <TBtn label="Italic" onClick={() => exec("italic")} compact={compact}>
        <span className="font-display text-sm font-semibold italic leading-none">
          I
        </span>
      </TBtn>
      <TBtn
        label="Strikethrough"
        onClick={() => exec("strike")}
        compact={compact}
      >
        <span className="font-display text-sm font-semibold leading-none line-through">
          S
        </span>
      </TBtn>
      <TBtn
        label="Clear formatting"
        onClick={() => exec("clear")}
        compact={compact}
      >
        <Icon>
          <path d="M5 5h14" />
          <path d="M10 5 8 19" />
          <path d="m15 14 5 5" />
          <path d="m20 14-5 5" />
        </Icon>
      </TBtn>
      <TBtn label="Link" onClick={() => exec("link")} compact={compact}>
        <Icon>
          <path d="M9 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
          <path d="M15 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5" />
        </Icon>
      </TBtn>

      <Divider />

      {/* 3. Lists */}
      <TBtn
        label="Bulleted list"
        onClick={() => exec("ul")}
        compact={compact}
      >
        <Icon>
          <path d="M8 6h12" />
          <path d="M8 12h12" />
          <path d="M8 18h12" />
          <path d="M4 6h.01" />
          <path d="M4 12h.01" />
          <path d="M4 18h.01" />
        </Icon>
      </TBtn>
      <TBtn
        label="Numbered list"
        onClick={() => exec("ol")}
        compact={compact}
      >
        <Icon>
          <path d="M10 6h10" />
          <path d="M10 12h10" />
          <path d="M10 18h10" />
          <path d="M4 5v4" />
          <path d="M3 9h2" />
          <path d="M4 14h1v3H4m0 0h1" />
        </Icon>
      </TBtn>

      <Divider />

      {/* 5. Block */}
      <TBtn label="Quote" onClick={() => exec("quote")} compact={compact}>
        <Icon>
          <path d="M6 17h3l1.5-4V7H5v6h2.5z" />
          <path d="M15 17h3l1.5-4V7H14v6h2.5z" />
        </Icon>
      </TBtn>
      <TBtn label="Code" onClick={() => exec("code")} compact={compact}>
        <span className="font-mono text-[12px] leading-none">{"</>"}</span>
      </TBtn>
      <TBtn label="Table" onClick={() => exec("table")} compact={compact}>
        <Icon>
          <rect x="4" y="5" width="16" height="14" rx="1" />
          <path d="M4 10h16" />
          <path d="M4 15h16" />
          <path d="M10 5v14" />
        </Icon>
      </TBtn>

      {/* 6. Spacer → Switch to Markdown */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSwitchToMarkdown}
        className="ml-auto shrink-0 whitespace-nowrap pl-2 pr-1 font-mono text-xs text-accent-soft hover:text-accent"
      >
        Switch to Markdown
      </button>
    </div>
  );
}
