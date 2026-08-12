"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FlagIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import { getRelativeTime } from "@/utils/relativeTime";

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

const chipBase =
  "rounded-full px-2 py-0.5 font-mono text-xs uppercase tracking-label";

type PreviewablePost = {
  type: string | null;
  slug: string | null;
  externalUrl: string | null;
  authorUsername: string | null;
};

// Where to send a moderator to actually read the thing they're judging.
// Discussions and questions live under /d/; a shared link IS its destination,
// so it points off-site; everything else renders at /{username}/{slug}, where
// the reader grants admins the same bypass the author has — so an in_review
// post previews exactly as readers would eventually see it.
function postPreviewHref(post: PreviewablePost): string | null {
  if (post.type === "link") return post.externalUrl;
  if (!post.slug) return null;
  if (post.type === "discussion" || post.type === "question") {
    return `/d/${post.slug}`;
  }
  if (!post.authorUsername) return null;
  return `/${post.authorUsername}/${post.slug}`;
}

const PreviewLink = ({ post }: { post: PreviewablePost }) => {
  const href = postPreviewHref(post);
  if (!href) return null;

  return (
    <Link href={href} target="_blank" className="secondary-button">
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      Preview
    </Link>
  );
};

// datetime-local is in the moderator's LOCAL time, so shift the `min` boundary
// by the tz offset before slicing to "YYYY-MM-DDTHH:mm".
function localDateTimeMin(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

const reasonColors: Record<ReportReason, string> = {
  SPAM: "bg-warning/12 text-warning",
  HARASSMENT: "bg-danger/12 text-danger",
  HATE_SPEECH: "bg-danger/12 text-danger",
  MISINFORMATION: "bg-accent/10 text-accent",
  COPYRIGHT: "bg-info/12 text-info",
  NSFW: "bg-accent/10 text-accent",
  OFF_TOPIC: "border border-hairline text-muted",
  OTHER: "border border-hairline text-muted",
};

const statusColors: Record<ReportStatus, string> = {
  PENDING: "bg-warning/12 text-warning",
  REVIEWED: "bg-info/12 text-info",
  DISMISSED: "border border-hairline text-muted",
  ACTIONED: "bg-danger/12 text-danger",
};

const ModerationQueue = () => {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | undefined>(
    "PENDING",
  );
  const utils = api.useUtils();

  // Deep-link from the moderation email: ?item=<postId> highlights/scrolls the
  // matching queue item (in either the awaiting-review or reported-live list).
  const searchParams = useSearchParams();
  const highlightedItem = searchParams.get("item");
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Optional per-item "Decline" note, keyed by postId.
  const [declineNotes, setDeclineNotes] = useState<Record<string, string>>({});

  // Per-postId future release time (datetime-local) for the "Schedule" affordance.
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>(
    {},
  );

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

  // Auto-moderation queue (posts awaiting review).
  const inReview = api.admin.listInReview.useQuery();

  // Live posts that have been flagged by users (open reports on published posts).
  const reportedPosts = api.admin.listReportedPosts.useQuery();

  const { mutate: moderatePost, isPending: isModerating } =
    api.admin.moderatePost.useMutation({
      onSuccess: (_data, variables) => {
        toast.success(
          variables.decision === "approve"
            ? variables.publishAt
              ? "Post approved and scheduled"
              : "Post approved"
            : variables.decision === "hide"
              ? "Post hidden and moved to review"
              : "Post declined",
        );
        utils.admin.listInReview.invalidate();
        utils.admin.listReportedPosts.invalidate();
        utils.report.getAll.invalidate();
        utils.report.getCounts.invalidate();
      },
      onError: () => {
        toast.error("Failed to update post");
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

  // Dismiss all open reports for a reported-live post (the post stays published).
  const handleDismissReportedPost = (reportIds: number[]) => {
    reportIds.forEach((reportId) =>
      reviewReport({
        reportId,
        status: "DISMISSED",
        actionTaken: "Reports dismissed by admin",
      }),
    );
    utils.admin.listReportedPosts.invalidate();
  };

  // Scroll to + highlight the ?item=<postId> deep-linked card once data loads.
  useEffect(() => {
    if (!highlightedItem) return;
    if (inReview.isLoading || reportedPosts.isLoading) return;
    const node = highlightRef.current;
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [
    highlightedItem,
    inReview.isLoading,
    reportedPosts.isLoading,
    inReview.data,
    reportedPosts.data,
  ]);

  const highlightClass = (id: string) =>
    highlightedItem === id ? "ring-2 ring-accent rounded-lg" : "";

  return (
    <div className="mx-auto max-w-6xl px-0 py-4 sm:px-4 sm:py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-fg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-fg">
            Moderation Queue
          </h1>
          <p className="mt-1 text-muted">Review and manage reported content</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-hairline">
        {(
          [
            ["PENDING", `Pending (${counts?.pending ?? 0})`],
            ["ACTIONED", `Actioned (${counts?.actioned ?? 0})`],
            ["DISMISSED", `Dismissed (${counts?.dismissed ?? 0})`],
            [undefined, `All (${counts?.total ?? 0})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            onClick={() => setStatusFilter(value)}
            className={`-mb-px border-b-2 px-4 py-2 font-mono text-sm uppercase tracking-label transition-colors ${
              statusFilter === value
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* In review — auto-moderation queue */}
      <section className="card mb-8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow m-0">
            <span className="slash">{"// "}</span>in review
          </p>
          <span className="bg-warning/12 rounded-full px-2 py-0.5 font-mono text-xs text-warning">
            {inReview.data?.length ?? 0} awaiting
          </span>
        </div>

        {inReview.isLoading && (
          <p className="font-mono text-xs text-faint">Loading…</p>
        )}

        {!inReview.isLoading && (inReview.data?.length ?? 0) === 0 && (
          <p className="font-mono text-xs text-faint">
            {"// nothing waiting for review"}
          </p>
        )}

        <div className="space-y-3">
          {inReview.data?.map((post) => (
            <div
              key={post.id}
              ref={highlightedItem === post.id ? highlightRef : undefined}
              className={`border-b border-hairline pb-3 last:border-0 last:pb-0 ${highlightClass(
                post.id,
              )}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-fg">
                    {post.title || "Untitled"}
                  </p>
                  <p className="font-mono text-xs text-faint">
                    @{post.authorUsername ?? "unknown"} ·{" "}
                    {getRelativeTime(post.createdAt!)}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {post.excerpt}
                    </p>
                  )}
                  {post.moderationNote && (
                    <p className="mt-1 text-sm text-muted">
                      <span className="font-medium text-fg">Reason:</span>{" "}
                      {post.moderationNote}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <PreviewLink post={post} />
                  <button
                    className="primary-button"
                    disabled={isModerating}
                    onClick={() =>
                      moderatePost({ id: post.id, decision: "approve" })
                    }
                  >
                    Approve
                  </button>
                  <button
                    className="secondary-button"
                    disabled={isModerating}
                    onClick={() =>
                      moderatePost({
                        id: post.id,
                        decision: "reject",
                        note: declineNotes[post.id]?.trim() || undefined,
                      })
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={declineNotes[post.id] ?? ""}
                onChange={(e) =>
                  setDeclineNotes((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                placeholder="Optional note shown to the author when declined…"
                className="mt-2 w-full rounded border border-hairline bg-inset px-3 py-1.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
              />
              {/* Approve & schedule: pick a future release time, then Schedule.
                  "Approve" (above) still publishes immediately. */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="font-mono text-xs uppercase tracking-label text-faint">
                  Schedule for
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTimes[post.id] ?? ""}
                  min={localDateTimeMin()}
                  onChange={(e) =>
                    setScheduleTimes((prev) => ({
                      ...prev,
                      [post.id]: e.target.value,
                    }))
                  }
                  className="rounded border border-hairline bg-inset px-3 py-1.5 text-sm text-fg focus:border-accent focus:outline-none"
                />
                <button
                  className="secondary-button px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={isModerating || !scheduleTimes[post.id]}
                  onClick={() => {
                    const value = scheduleTimes[post.id];
                    if (!value) return;
                    const when = new Date(value);
                    if (when.getTime() <= Date.now()) {
                      toast.error("Pick a time in the future");
                      return;
                    }
                    moderatePost({
                      id: post.id,
                      decision: "approve",
                      publishAt: when.toISOString(),
                    });
                  }}
                >
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reported (live) — published posts users have flagged */}
      <section className="card mb-8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="eyebrow m-0">
            <span className="slash">{"// "}</span>reported (live)
          </p>
          <span className="bg-danger/12 rounded-full px-2 py-0.5 font-mono text-xs text-danger">
            {reportedPosts.data?.length ?? 0} flagged
          </span>
        </div>

        {reportedPosts.isLoading && (
          <p className="font-mono text-xs text-faint">Loading…</p>
        )}

        {!reportedPosts.isLoading &&
          (reportedPosts.data?.length ?? 0) === 0 && (
            <p className="font-mono text-xs text-faint">
              {"// no flagged live posts"}
            </p>
          )}

        <div className="space-y-3">
          {reportedPosts.data?.map((post) => (
            <div
              key={post.id}
              ref={highlightedItem === post.id ? highlightRef : undefined}
              className={`border-b border-hairline pb-3 last:border-0 last:pb-0 ${highlightClass(
                post.id,
              )}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-fg">
                    {post.title || "Untitled"}
                  </p>
                  <p className="font-mono text-xs text-faint">
                    @{post.authorUsername ?? "unknown"} · {post.reportCount}{" "}
                    report
                    {post.reportCount === 1 ? "" : "s"}
                    {post.latestReportAt
                      ? ` · ${getRelativeTime(post.latestReportAt)}`
                      : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`${chipBase} ${
                        reasonColors[post.latestReason as ReportReason] ??
                        "border border-hairline text-muted"
                      }`}
                    >
                      {reasonLabels[post.latestReason as ReportReason] ??
                        post.latestReason}
                    </span>
                    {post.latestDetails && (
                      <span className="text-sm text-muted">
                        {post.latestDetails}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {post.authorUsername && post.slug && (
                    <Link
                      href={`/${post.authorUsername}/${post.slug}`}
                      target="_blank"
                      className="secondary-button px-3 py-1.5 text-sm"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      View
                    </Link>
                  )}
                  <button
                    className="secondary-button px-3 py-1.5 text-sm text-danger"
                    disabled={isModerating}
                    onClick={() =>
                      moderatePost({ id: post.id, decision: "hide" })
                    }
                  >
                    <EyeSlashIcon className="h-4 w-4" />
                    Hide
                  </button>
                  <button
                    className="secondary-button px-3 py-1.5 text-sm"
                    disabled={isReviewing}
                    onClick={() => handleDismissReportedPost(post.reportIds)}
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-hairline bg-surface p-4"
              >
                <div className="mb-3 h-4 w-1/4 rounded bg-elevated" />
                <div className="mb-2 h-6 w-3/4 rounded bg-elevated" />
                <div className="h-4 w-1/2 rounded bg-elevated" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.reports.length === 0 && (
          <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
            <FlagIcon className="mx-auto h-12 w-12 text-faint" />
            <h3 className="mt-4 font-display text-lg font-semibold text-fg">
              No reports found
            </h3>
            <p className="mt-2 text-muted">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} reports`
                : "All caught up!"}
            </p>
          </div>
        )}

        {data?.reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg border border-hairline bg-surface p-4"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`${chipBase} ${reasonColors[report.reason as ReportReason]}`}
              >
                {reasonLabels[report.reason as ReportReason]}
              </span>
              <span
                className={`${chipBase} ${statusColors[report.status as ReportStatus]}`}
              >
                {report.status}
              </span>
              <span className="font-mono text-xs text-faint">
                {getRelativeTime(report.createdAt!)}
              </span>
            </div>

            <div className="mb-3">
              {report.content && (
                <div className="rounded border border-hairline bg-inset p-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-label text-faint">
                    {report.content.type} by @{report.content.user?.username}
                  </p>
                  <p className="font-medium text-fg">{report.content.title}</p>
                </div>
              )}
              {report.discussion && (
                <div className="rounded border border-hairline bg-inset p-3">
                  <p className="mb-1 font-mono text-xs uppercase tracking-label text-faint">
                    Comment by @{report.discussion.user?.username}
                  </p>
                  <p className="line-clamp-2 text-fg">
                    {report.discussion.body}
                  </p>
                </div>
              )}
            </div>

            {report.details && (
              <div className="mb-3">
                <p className="text-sm text-muted">
                  <span className="font-medium text-fg">Details:</span>{" "}
                  {report.details}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Reported by @{report.reporter?.username || "unknown"}
              </p>

              {report.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(report.id)}
                    disabled={isReviewing}
                    className="secondary-button px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleAction(report.id)}
                    disabled={isReviewing}
                    className="secondary-button px-3 py-1.5 text-sm text-danger disabled:opacity-50"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Take Action
                  </button>
                </div>
              )}

              {report.status !== "PENDING" && report.reviewedBy && (
                <p className="text-sm text-muted">
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
