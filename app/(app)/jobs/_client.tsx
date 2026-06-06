"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/server/trpc/react";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import { Heading } from "@/components/ui-components/heading";

type JobTypeFilter = "" | "full-time" | "part-time" | "freelancer" | "other";

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

  const jobs = data?.jobs ?? [];

  return (
    <div className="mx-auto max-w-4xl p-3 pt-8 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level={1}>AI developer jobs</Heading>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Roles building with AI — LLMs, agents, and AI-native products.
          </p>
        </div>
        <Link href="/jobs/create" className="primary-button">
          Post a job
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setRemote((v) => !v)}
          aria-pressed={remote}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            remote
              ? "border-accent bg-accent text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          Remote
        </button>
        <button
          type="button"
          onClick={() => setAiNative((v) => !v)}
          aria-pressed={aiNative}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            aiNative
              ? "border-accent bg-accent text-white"
              : "border-neutral-300 text-neutral-700 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
          }`}
        >
          AI-native
        </button>
        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value as JobTypeFilter)}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        >
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="freelancer">Freelance</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Listings */}
      <div className="mt-8 space-y-4">
        {isLoading && (
          <p className="text-neutral-500 dark:text-neutral-400">
            Loading jobs…
          </p>
        )}

        {!isLoading && jobs.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
            <p className="font-medium text-neutral-700 dark:text-neutral-300">
              No jobs yet.
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Be the first to{" "}
              <Link href="/jobs/create" className="text-accent underline">
                post a role
              </Link>
              .
            </p>
          </div>
        )}

        {jobs.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.slug}`}
            className={`block rounded-lg border bg-white p-5 transition-colors hover:border-neutral-400 dark:bg-neutral-900 ${
              j.featured
                ? "border-accent/60 ring-1 ring-accent/30"
                : "border-neutral-200 dark:border-neutral-800 dark:hover:border-neutral-700"
            }`}
          >
            <div className="flex items-start gap-4">
              <Image
                src={j.companyLogo || "/images/company_placeholder.png"}
                width={48}
                height={48}
                alt={`${j.companyName} logo`}
                className="rounded-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    {j.jobTitle}
                  </h2>
                  {j.featured && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {j.companyName} · {j.jobLocation}
                  {j.remote ? " · Remote" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {TYPE_LABELS[j.type] ?? j.type}
                  </span>
                  {j.aiNative && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent dark:bg-accent/15 dark:text-accent">
                      AI-native
                    </span>
                  )}
                  {j.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
