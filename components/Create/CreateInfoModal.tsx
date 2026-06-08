"use client";

import Link from "next/link";

/**
 * First-visit dos & don'ts gate, shown once before the create hub.
 * Mirrors ui_kits/app/Compose.jsx → CreateInfoModal. The "seen once" state is
 * owned by the provider (localStorage), so this is a pure presentational modal.
 */
const DOS = [
  "Share what you learned, built, or broke — specifics help.",
  "Ask real questions, and show what you already tried.",
  "Credit sources; add a canonical link if you cross-post.",
  "Stick around to reply — the best threads come from the author.",
];

const DONTS = [
  "Drop a launch link and leave.",
  "Farm followers or post pure self-promo.",
  "Post hype with nothing behind it.",
  "Be a jerk — assume good faith.",
];

export function CreateInfoModal({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[75] flex items-start justify-center overflow-y-auto px-6 pb-6 pt-[clamp(1rem,6vh,5rem)]"
      style={{ background: "rgba(4,5,7,0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Posting on Codú"
        className="w-full max-w-[600px] overflow-hidden rounded-xl border border-strong bg-elevated shadow-lg"
      >
        <div className="px-6 pt-6">
          <p className="eyebrow">
            <span className="slash">{"// "}</span>before you post
          </p>
          <h3 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight">
            Codú is a room worth keeping good.
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            A quick read, once. Posts are auto-checked for spam and articles get
            a human editor before they go live.
          </p>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-success">
              Do
            </p>
            <ul className="flex flex-col gap-3">
              {DOS.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2 text-sm leading-snug text-muted"
                >
                  <span className="shrink-0 text-success">✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-danger">
              Don&apos;t
            </p>
            <ul className="flex flex-col gap-3">
              {DONTS.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2 text-sm leading-snug text-muted"
                >
                  <span className="shrink-0 text-danger">✕</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline bg-surface px-6 py-4">
          <Link
            href="/code-of-conduct"
            className="font-mono text-[11px] text-accent-soft hover:text-accent"
          >
            Read the full code of conduct ›
          </Link>
          <button className="primary-button ml-auto" onClick={onContinue}>
            Got it — let&apos;s create
          </button>
        </div>
      </div>
    </div>
  );
}
