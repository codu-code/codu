"use client";

import { useState } from "react";

type VoteState = "up" | "down" | null;

export interface VoteControlProps {
  /** The net/score baseline (excludes the current user's own vote). */
  base: number;
  /** The user's existing vote, if any. */
  initial?: VoteState;
  /** Tighter sizing for feed rows + comments/replies. */
  compact?: boolean;
  /** Logged-out intercept — called instead of voting; voting is skipped. */
  onGate?: () => void;
  /** Fires the actual mutation with the next vote state. */
  onVote?: (next: VoteState) => void;
}

const Chevron = ({
  direction,
  size,
}: {
  direction: "up" | "down";
  size: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={direction === "up" ? "M6 14l6-6 6 6" : "M6 10l6 6 6-6"} />
  </svg>
);

const VoteControl = ({
  base,
  initial = null,
  compact = false,
  onGate,
  onVote,
}: VoteControlProps) => {
  const [vote, setVote] = useState<VoteState>(initial);

  const score = base + (vote === "up" ? 1 : vote === "down" ? -1 : 0);

  const handle = (e: React.MouseEvent, direction: "up" | "down") => {
    e.stopPropagation();
    if (onGate) {
      // Logged-out intercept: gate and bail without mutating local state.
      onGate();
      return;
    }
    const next: VoteState = vote === direction ? null : direction;
    setVote(next);
    onVote?.(next);
  };

  const arrowSize = compact ? 13 : 15;
  const pad = "px-1.5 py-0.5";

  const upColor =
    vote === "up"
      ? "text-accent-soft"
      : "text-faint hover:text-accent-soft";
  const downColor =
    vote === "down" ? "text-danger" : "text-faint hover:text-danger";
  const scoreColor =
    vote === "up"
      ? "text-accent-soft"
      : vote === "down"
        ? "text-danger"
        : "text-muted";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline ${pad}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => handle(e, "up")}
        aria-label="Upvote"
        aria-pressed={vote === "up"}
        className={`flex items-center transition-colors ${upColor}`}
      >
        <Chevron direction="up" size={arrowSize} />
      </button>
      <span
        className={`tabular-nums text-center text-xs font-semibold transition-colors ${scoreColor}`}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={(e) => handle(e, "down")}
        aria-label="Downvote"
        aria-pressed={vote === "down"}
        className={`flex items-center transition-colors ${downColor}`}
      >
        <Chevron direction="down" size={arrowSize} />
      </button>
    </div>
  );
};

export default VoteControl;
