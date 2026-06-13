"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { subscribeToNewsletter } from "@/app/actions/subscribeNewsletter";
import { Eyebrow } from "./Eyebrow";

/**
 * The funnel's core capture primitive. On-site email capture wired to beehiiv.
 * - variant="inline"  → full block (end of articles, homepage section)
 * - variant="compact" → tighter (sidebar rail)
 * No gradients, no popups. Token-driven.
 */
export function NewsletterCapture({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "compact";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || done) return;
    setLoading(true);
    const res = await subscribeToNewsletter(email);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  const compact = variant === "compact";

  return (
    <section
      className={clsx(
        "rounded-xl border border-hairline bg-surface",
        compact ? "p-5" : "p-8 sm:p-10",
        className,
      )}
    >
      <Eyebrow>the newsletter · codú weekly</Eyebrow>
      <h3
        className={clsx(
          "mt-3 font-display font-extrabold tracking-tight text-fg",
          compact ? "text-xl" : "text-2xl sm:text-3xl",
        )}
      >
        What to build with AI<span className="text-accent">.</span> Weekly.
      </h3>
      <p className={clsx("mt-2 text-muted", compact ? "text-sm" : "text-base")}>
        The tools, releases, and ideas worth your time — in 5 minutes, every
        Tuesday. Free.
      </p>

      {done ? (
        <p className="mt-5 font-mono text-sm text-accent">
          ✓ You&apos;re on the list.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className={clsx("mt-5 flex gap-2", compact && "flex-col")}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className="w-full rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="primary-button whitespace-nowrap disabled:cursor-not-allowed"
          >
            {loading ? "…" : "Subscribe"}
          </button>
        </form>
      )}

      <p className="mt-3 font-mono text-xs text-faint">
        No spam. Unsubscribe anytime.
      </p>
    </section>
  );
}
