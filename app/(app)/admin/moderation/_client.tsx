"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FlagIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";

type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "ACTIONED";
type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "MISINFORMATION"
  | "COPYRIGHT"
  | "NSFW"
  | "OFF_TOPIC"
  | "OTHER";

const reasonLabels: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  HATE_SPEECH: "Hate Speech",
  MISINFORMATION: "Misinformation",
  COPYRIGHT: "Copyright",
  NSFW: "NSFW",
  OFF_TOPIC: "Off Topic",
  OTHER: "Other",
};

const reasonColors: Record<ReportReason, string> = {
  SPAM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  HARASSMENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  HATE_SPEECH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  MISINFORMATION:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  COPYRIGHT:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  NSFW: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  OFF_TOPIC: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusColors: Record<ReportStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REVIEWED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DISMISSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  ACTIONED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const ModerationQueue = () => {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(
    "PENDING",
  );
  const utils = api.useUtils();

  const { data, isLoading } = api.report.getAll.useQuery({
    status: statusFilter,
    limit: 20,
  });

  const { data: counts } = api.report.getCounts.useQuery();

  const { mutate: reviewReport, isPending: isReviewing } =
    api.report.review.useMutation({
      onSuccess: () => {
        toast.success("Report updated");
        utils.report.getAll.invalidate();
        utils.report.getCounts.invalidate();
      },
      onError: () => {
        toast.error("Failed to update report");
      },
    });

  const handleDismiss = (reportId: number) => {
    reviewReport({
      reportId,
      status: "DISMISSED",
      actionTaken: "Report dismissed by admin",
    });
  };

  const handleAction = (reportId: number) => {
    reviewReport({
      reportId,
      status: "ACTIONED",
      actionTaken: "Content removed or user warned",
    });
  };

  const getRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Moderation Queue
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Review and manage reported content
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "PENDING"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          }`}
        >
          Pending ({counts?.pending ?? 0})
        </button>
        <button
          onClick={() => setStatusFilter("ACTIONED")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "ACTIONED"
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          }`}
        >
          Actioned ({counts?.actioned ?? 0})
        </button>
        <button
          onClick={() => setStatusFilter("DISMISSED")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === "DISMISSED"
              ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          }`}
        >
          Dismissed ({counts?.dismissed ?? 0})
        </button>
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            statusFilter === undefined
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          }`}
        >
          All ({counts?.total ?? 0})
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="mb-3 h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="mb-2 h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.reports.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <FlagIcon className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">
              No reports found
            </h3>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} reports`
                : "All caught up!"}
            </p>
          </div>
        )}

        {data?.reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
          >
            {/* Header */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${reasonColors[report.reason as ReportReason]}`}
              >
                {reasonLabels[report.reason as ReportReason]}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[report.status as ReportStatus]}`}
              >
                {report.status}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {getRelativeTime(report.createdAt!)}
              </span>
            </div>

            {/* Content Preview */}
            <div className="mb-3">
              {report.content && (
                <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="mb-1 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    {report.content.type} by @{report.content.user?.username}
                  </p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {report.content.title}
                  </p>
                </div>
              )}
              {report.discussion && (
                <div className="rounded border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="mb-1 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    Comment by @{report.discussion.user?.username}
                  </p>
                  <p className="line-clamp-2 text-neutral-900 dark:text-white">
                    {report.discussion.body}
                  </p>
                </div>
              )}
            </div>

            {/* Reporter Details */}
            {report.details && (
              <div className="mb-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Details:</span> {report.details}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Reported by @{report.reporter?.username || "unknown"}
              </p>

              {/* Actions */}
              {report.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(report.id)}
                    disabled={isReviewing}
                    className="flex items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleAction(report.id)}
                    disabled={isReviewing}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Take Action
                  </button>
                </div>
              )}

              {report.status !== "PENDING" && report.reviewedBy && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Reviewed by @{report.reviewedBy.username}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModerationQueue;
