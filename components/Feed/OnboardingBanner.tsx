"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "codu.onboarding.dismissed";

const STEPS = [
  { label: "Pick your topics", href: "/feed" },
  { label: "Follow 3 builders", href: "/discussions" },
  { label: "Post your first tip", href: "/create?kind=til" },
];

// Tiny external store so dismissal is read without setState-in-effect and stays
// SSR-safe (server snapshot = not dismissed → banner renders, client reads
// localStorage on hydration).
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const isDismissed = () =>
  typeof window !== "undefined" && localStorage.getItem(KEY) === "1";

/**
 * First-run guidance: a dismissible "first win in 3 steps" banner. Onboarding is
 * the #1 retention lever, so we guide the first action. Mirrors
 * ui_kits/app/Feed.jsx → OnboardingBanner.
 */
export function OnboardingBanner() {
  const dismissed = useSyncExternalStore(
    subscribe,
    isDismissed,
    () => false,
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    listeners.forEach((l) => l());
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-strong bg-surface p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-dots bg-[length:22px_22px] opacity-35"
        style={{
          maskImage:
            "radial-gradient(80% 120% at 100% 0%, #000, transparent 70%)",
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              <span className="slash">{"// "}</span>welcome to codú
            </p>
            <h3 className="mt-2 font-display text-xl font-extrabold">
              Get your first win in 3 steps
            </h3>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="font-mono text-[13px] text-faint hover:text-muted"
          >
            ✕
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className="flex items-center gap-3 rounded-md border border-hairline bg-elevated p-3 transition-colors hover:border-strong"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-strong font-mono text-xs text-faint">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-fg">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
