"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Slim, dismissible bottom bar for logged-out sessions. Reading is free; this is
 * a soft nudge, not a wall.
 */
export function SignInBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-strong"
      style={{
        background:
          "color-mix(in srgb, rgb(var(--color-elevated)) 92%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-[clamp(1rem,3vw,2rem)] py-3">
        <span className="text-sm text-fg">
          Learn to build with AI and grow with people doing the same — it&apos;s
          free.
        </span>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => signIn()}
            className="whitespace-nowrap text-sm font-semibold text-fg"
          >
            Log in
          </button>
          <button
            onClick={() => signIn()}
            className="primary-button whitespace-nowrap"
          >
            Join free
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="font-mono text-[13px] text-faint hover:text-muted"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
