"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/server/trpc/react";
import { TOPIC_POOL } from "./topics";

/**
 * Edit "Your topics" — add/remove the topics that tune the feed. Reads + writes
 * via profile.myInterests / profile.updateInterests. Mirrors
 * ui_kits/app/AppShell.jsx → TopicsModal.
 */
export function TopicsModal({ onClose }: { onClose: () => void }) {
  const utils = api.useUtils();
  const { data } = api.profile.myInterests.useQuery();
  const [draft, setDraft] = useState<string[]>(data?.topics ?? []);
  // Seed once from the query when it first arrives (without a setState effect).
  const [seeded, setSeeded] = useState(false);
  if (!seeded && data) {
    setSeeded(true);
    setDraft(data.topics);
  }

  const { mutate: save, status } = api.profile.updateInterests.useMutation({
    onSuccess: () => {
      void utils.profile.myInterests.invalidate();
      toast.success("Topics updated");
      onClose();
    },
    onError: (err) => toast.error(err.message || "Couldn't save topics"),
  });

  const toggle = (t: string) =>
    setDraft((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));

  const saving = status === "pending";

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
        aria-label="Edit your topics"
        className="w-full max-w-[540px] overflow-hidden rounded-xl border border-strong bg-elevated shadow-lg"
      >
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              <span className="slash">{"// "}</span>your topics
            </p>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-base leading-none text-faint hover:text-muted"
            >
              ✕
            </button>
          </div>
          <h3 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight">
            Tune your feed
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Add or remove topics — we&apos;ll prioritise these across your feed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pb-6 pt-5">
          {TOPIC_POOL.map((t) => {
            const on = draft.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggle(t)}
                aria-pressed={on}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "border-accent bg-accent/10 text-accent-soft"
                    : "border-hairline text-muted hover:border-strong hover:text-fg"
                }`}
              >
                {on && <span className="mr-1.5 text-[11px]">✓</span>}
                {t}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-hairline bg-surface px-6 py-4">
          <span className="font-mono text-[11px] text-faint">
            {draft.length} selected
          </span>
          <div className="flex gap-3">
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={saving}
              onClick={() => save({ topics: draft })}
            >
              {saving ? "Saving…" : "Save topics"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
