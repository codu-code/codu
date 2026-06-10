"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { api } from "@/server/trpc/react";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

const KEY = "codu.onboarding.dismissed";

// External store so dismissal is SSR-safe: server snapshot = not dismissed.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const isDismissed = () =>
  typeof window !== "undefined" && localStorage.getItem(KEY) === "1";

/**
 * First-run guidance: a dismissible "first win in 3 steps" banner. Steps reflect
 * REAL completion (topics picked / 3 follows / first post) via
 * engagement.onboardingWins — done steps show a mint check + strikethrough. The
 * banner hides itself once all three are done; the reward moment (confetti +
 * first badge) is fired app-wide by <OnboardingCelebration>, not here, so it
 * still plays when the last step is completed off the feed.
 */
export function OnboardingBanner() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => false);
  const { openTopics, openCompose } = useShellActions();
  const { data: wins } = api.engagement.onboardingWins.useQuery();

  // Actions reuse the shell modals so they work when the rail is hidden on mobile.
  const steps = [
    {
      label: "Pick your topics",
      done: !!wins?.pickedTopics,
      onClick: openTopics,
      href: undefined as string | undefined,
    },
    {
      label: "Follow 3 builders",
      done: !!wins?.followedThree,
      onClick: undefined,
      href: "/discussions",
    },
    {
      label: "Post your first tip",
      done: !!wins?.posted,
      onClick: () => openCompose("discussion"),
      href: undefined as string | undefined,
    },
  ];

  const allDone = wins ? steps.every((s) => s.done) : false;

  // Banner's job is done once all steps are complete; the celebration is owned
  // by the app-wide <OnboardingCelebration>.
  if (allDone) return null;

  if (dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;

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

        <div className="mt-4 flex gap-1.5">
          {steps.map((s, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${
                s.done ? "bg-accent" : "bg-elevated"
              }`}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {steps.map((s) => {
            const inner = (
              <>
                <span
                  className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-xs ${
                    s.done
                      ? "bg-accent font-bold text-on-accent"
                      : "border border-strong text-faint"
                  }`}
                >
                  {s.done ? "✓" : ""}
                </span>
                <span
                  className={`text-sm font-medium ${
                    s.done ? "text-muted line-through" : "text-fg"
                  }`}
                >
                  {s.label}
                </span>
              </>
            );
            const className = `flex items-center gap-3 rounded-md border border-hairline p-3 text-left transition-colors ${
              s.done ? "bg-transparent" : "bg-elevated hover:border-strong"
            }`;
            return s.href ? (
              <Link key={s.label} href={s.href} className={className}>
                {inner}
              </Link>
            ) : (
              <button
                key={s.label}
                type="button"
                onClick={s.onClick}
                className={className}
              >
                {inner}
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-xs text-faint">{doneCount}/3 done</p>
      </div>
    </div>
  );
}
