"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { notFound } from "next/navigation";
import type { inferRouterOutputs } from "@trpc/server";
import { api } from "@/server/trpc/react";
import type { AppRouter } from "@/server/api/router";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";

type JobTypeFilter = "" | "full-time" | "part-time" | "freelancer" | "other";

type Job = inferRouterOutputs<AppRouter>["job"]["list"]["jobs"][number];

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelancer: "Freelance",
  other: "Other",
};

export default function JobsClient() {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.JOBS);
  const [remote, setRemote] = useState(false);
  const [aiNative, setAiNative] = useState(false);
  const [jobType, setJobType] = useState<JobTypeFilter>("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = api.job.list.useQuery(
    {
      remote: remote || undefined,
      aiNative: aiNative || undefined,
      jobType: jobType || undefined,
    },
    { enabled: flagEnabled },
  );

  if (!flagEnabled) {
    notFound();
  }

  const q = search.trim().toLowerCase();
  const jobs = (data?.jobs ?? []).filter((j) => {
    if (!q) return true;
    return [j.jobTitle, j.companyName, j.jobLocation, ...j.tags]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q));
  });
  const featured = jobs.filter((j) => j.featured);
  const rest = jobs.filter((j) => !j.featured);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>hiring
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
            Jobs
          </h1>
        </div>
        <Link href="/jobs/create" className="primary-button">
          Post a job
        </Link>
      </div>
      <p className="mt-3 max-w-[60ch] leading-snug text-muted">
        Roles building with AI — LLMs, agents, and AI-native products.
      </p>

      {/* Search + filter chips */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies, stacks…"
            className="w-full rounded-md border border-hairline bg-surface px-3.5 py-2 font-sans text-sm text-fg outline-none placeholder:text-faint focus:border-strong"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRemote((v) => !v)}
            aria-pressed={remote}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              remote
                ? "bg-accent text-on-accent"
                : "border border-hairline text-muted hover:text-fg"
            }`}
          >
            Remote
          </button>
          <button
            type="button"
            onClick={() => setAiNative((v) => !v)}
            aria-pressed={aiNative}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
              aiNative
                ? "bg-accent text-on-accent"
                : "border border-hairline text-muted hover:text-fg"
            }`}
          >
            AI-native
          </button>
          {(
            [
              ["", "All types"],
              ["full-time", "Full-time"],
              ["part-time", "Part-time"],
              ["freelancer", "Freelance"],
              ["other", "Other"],
            ] as [JobTypeFilter, string][]
          ).map(([value, label]) => {
            const on = jobType === value;
            return (
              <button
                key={value || "all"}
                type="button"
                onClick={() => setJobType(value)}
                aria-pressed={on}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
                  on
                    ? "bg-accent text-on-accent"
                    : "border border-hairline text-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {isLoading && (
          <p className="font-mono text-sm text-faint">{"// "}loading jobs…</p>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="rounded-lg border border-dashed border-hairline p-10 text-center">
            <p className="font-medium text-fg">No jobs yet.</p>
            <p className="mt-1 text-sm text-muted">
              Be the first to{" "}
              <Link href="/jobs/create" className="text-accent underline">
                post a role
              </Link>
              .
            </p>
          </div>
        )}

        {!isLoading && featured.length > 0 && (
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-faint">
              Featured
            </p>
            <div className="space-y-3">
              {featured.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && rest.length > 0 && (
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-faint">
              All roles
            </p>
            <div className="space-y-3">
              {rest.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job: j }: { job: Job }) {
  const glyph = (j.companyName?.charAt(0) || "?").toUpperCase();
  return (
    <Link
      href={`/jobs/${j.slug}`}
      className={`block rounded-lg border bg-surface p-5 transition-colors hover:border-strong ${
        j.featured ? "border-strong" : "border-hairline"
      }`}
    >
      <div className="flex items-start gap-4">
        {j.companyLogo ? (
          <Image
            src={j.companyLogo}
            width={52}
            height={52}
            alt={`${j.companyName} logo`}
            className="h-[52px] w-[52px] shrink-0 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-elevated font-display text-xl font-extrabold text-accent">
            {glyph}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold text-fg">
              {j.jobTitle}
            </h2>
            {j.featured && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
                Featured
              </span>
            )}
          </div>
          <p className="font-mono text-sm text-faint">
            {j.companyName} · {j.jobLocation}
            {j.remote ? " · Remote" : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-xs text-muted">
              {TYPE_LABELS[j.type] ?? j.type}
            </span>
            {j.aiNative && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent dark:bg-accent/15">
                AI-native
              </span>
            )}
            {j.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-hairline px-2 py-0.5 font-mono text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
