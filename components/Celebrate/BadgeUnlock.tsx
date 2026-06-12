"use client";

import Link from "next/link";

// Regular hexagon (flat-top) clip-path — matches the kit's badge tile shape.
const HEX_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

interface BadgeUnlockProps {
  /** Display name of the unlocked badge, e.g. "First Post". */
  badgeName: string;
  /** Badge emoji shown in the hexagon tile. */
  emoji?: string | null;
  /** Points awarded, shown as `+{points}`; omit to hide the line. */
  points?: number;
  /** Current user's username, for the "See your badges" profile link. */
  username: string | null;
  /** Close the dialog. */
  onClose: () => void;
}

/**
 * Full-screen celebration dialog shown when a user unlocks a badge.
 * A hexagon badge tile pops in (with a pulsing halo) above an eyebrow, the badge
 * name, the points line, and two actions. Motion is CSS-gated on
 * prefers-reduced-motion — reduced-motion users get the static dialog.
 */
export function BadgeUnlock({
  badgeName,
  emoji,
  points,
  username,
  onClose,
}: BadgeUnlockProps) {
  const badgesHref = username ? `/${username}?tab=achievements` : "/settings";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto px-6 py-10"
      style={{ background: "rgba(4,5,7,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Badge unlocked"
        className="w-full max-w-[420px] overflow-hidden rounded-xl border border-strong bg-elevated p-8 text-center shadow-pop"
      >
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span
            aria-hidden
            className="codu-ring-pulse absolute h-24 w-24 rounded-full"
            style={{ border: "2px solid rgb(var(--color-accent))" }}
          />
          <div
            aria-hidden
            className="codu-badge-pop flex h-24 w-24 items-center justify-center bg-accent text-3xl text-on-accent"
            style={{ clipPath: HEX_CLIP }}
          >
            {emoji || "🏅"}
          </div>
        </div>

        <p className="eyebrow mt-6">
          <span className="slash">{"// "}</span>badge unlocked
        </p>
        <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
          {badgeName}
        </h3>
        {points !== undefined && (
          <p className="mt-2 font-mono text-sm font-semibold text-accent-soft">
            +{points} points
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button w-full sm:w-auto"
          >
            Keep browsing
          </button>
          <Link
            href={badgesHref}
            onClick={onClose}
            className="primary-button w-full sm:w-auto"
          >
            See your badges
          </Link>
        </div>
      </div>
    </div>
  );
}
