"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { api } from "@/server/trpc/react";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import { Heading } from "@/components/ui-components/heading";

const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelancer: "Freelance",
  other: "Other",
};

export default function JobDetailClient({ slug }: { slug: string }) {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.JOBS);
  const {
    data: job,
    isLoading,
    isError,
  } = api.job.getBySlug.useQuery({ slug }, { enabled: flagEnabled, retry: false });

  if (!flagEnabled) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-3 pt-8 sm:px-4">
        <p className="text-neutral-500 dark:text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-3xl p-3 pt-8 text-center sm:px-4">
        <Heading level={1}>Job not found</Heading>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          This listing may have expired or been removed.
        </p>
        <Link href="/jobs" className="primary-button mt-6 inline-block">
          Back to all jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-3 pt-8 sm:px-4">
      <Link
        href="/jobs"
        className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        ← All jobs
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <Image
          src={job.companyLogo || "/images/company_placeholder.png"}
          width={64}
          height={64}
          alt={`${job.companyName} logo`}
          className="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading level={1}>{job.jobTitle}</Heading>
            {job.featured && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                Featured
              </span>
            )}
          </div>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {job.companyName} · {job.jobLocation}
            {job.remote ? " · Remote" : ""}
          </p>
        </div>
      </div>

      {/* Meta badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          {TYPE_LABELS[job.type] ?? job.type}
        </span>
        {job.aiNative && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent dark:bg-accent/15 dark:text-accent">
            AI-native
          </span>
        )}
        {job.relocation && (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Relocation
          </span>
        )}
        {job.visaSponsorship && (
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            Visa sponsorship
          </span>
        )}
        {job.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Apply */}
      {job.applicationUrl && (
        <div className="mt-6">
          <Link
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="primary-button inline-block"
          >
            Apply for this role
          </Link>
        </div>
      )}

      {/* Description */}
      {job.jobDescription && (
        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
          {job.jobDescription}
        </div>
      )}
    </div>
  );
}
