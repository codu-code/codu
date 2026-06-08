"use client";

import Link from "next/link";
import {
  PencilSquareIcon,
  BriefcaseIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";

/**
 * Rail conversion hub (IndieHackers-style): the key "contribute / monetise"
 * actions in one place. Drop into content-page sidebars.
 */
export function ConversionHub({ className }: { className?: string }) {
  // Jobs is flag-gated until launch (auto-on in dev); "Post a job" links to the
  // flag-gated /jobs/create, so only show it when Jobs is enabled.
  const jobsEnabled = isFlagEnabled(FEATURE_FLAGS.JOBS);
  const items = [
    { icon: PencilSquareIcon, label: "Write a post", href: "/create" },
    ...(jobsEnabled
      ? [{ icon: BriefcaseIcon, label: "Post a job", href: "/jobs/create" }]
      : []),
    { icon: MegaphoneIcon, label: "Advertise with us", href: "/advertise" },
  ];

  return (
    <div
      className={`overflow-hidden rounded-xl border border-hairline bg-surface ${className ?? ""}`}
    >
      {items.map((item, i) => (
        <Link
          key={item.label}
          href={item.href}
          className={`group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated ${
            i > 0 ? "border-t border-hairline" : ""
          }`}
        >
          <item.icon className="h-5 w-5 shrink-0 text-accent" />
          <span className="text-sm font-medium text-fg">{item.label}</span>
          <span className="ml-auto font-mono text-xs text-faint transition-transform group-hover:translate-x-0.5">
            ›
          </span>
        </Link>
      ))}
    </div>
  );
}
