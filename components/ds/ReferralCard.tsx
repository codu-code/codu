"use client";

import { useState } from "react";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";

/** Invite link + referral count. For signed-in users (settings). */
export function ReferralCard() {
  const { data } = api.engagement.myReferral.useQuery(undefined, {
    retry: false,
  });
  const [copied, setCopied] = useState(false);

  if (!data?.code) return null;
  const link = `https://www.codu.co/get-started?ref=${data.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          aria-label="Your invite link"
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-fg outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="secondary-button whitespace-nowrap"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        {data.count} {data.count === 1 ? "builder has" : "builders have"} joined
        via your link — you earn points and the Connector badge for each.
      </p>
    </div>
  );
}
