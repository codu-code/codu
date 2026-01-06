"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { XMarkIcon, FlagIcon } from "@heroicons/react/20/solid";
import { toast } from "sonner";
import { signIn, useSession } from "next-auth/react";
import { api } from "@/server/trpc/react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

// Report types for different content
export type ReportType = "post" | "comment" | "discussion" | "article";

type ReportItem = {
  type: ReportType;
  id: string | number;
  title?: string;
  comment?: string;
};

// URL-aware hook for report modal state
export function useReportModal() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const reportParam = searchParams?.get("report");

  // Parse report param format: type_id (e.g., "post_abc123", "article_42")
  const parseReportParam = useCallback(
    (param: string | null): { type: ReportType; id: string | number } | null => {
      if (!param) return null;
      const [type, ...idParts] = param.split("_");
      const id = idParts.join("_");
      if (!type || !id) return null;

      const validTypes: ReportType[] = ["post", "comment", "discussion", "article"];
      if (!validTypes.includes(type as ReportType)) return null;

      // Articles use numeric IDs, posts use string IDs
      const parsedId = type === "article" || type === "comment" || type === "discussion"
        ? parseInt(id, 10)
        : id;

      if (typeof parsedId === "number" && isNaN(parsedId)) return null;

      return { type: type as ReportType, id: parsedId };
    },
    [],
  );

  const reportData = parseReportParam(reportParam);

  const openReport = useCallback(
    (type: ReportType, id: string | number) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("report", `${type}_${id}`);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  const closeReport = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("report");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  return {
    isOpen: !!reportData,
    reportData,
    openReport,
    closeReport,
  };
}

// Global modal component that reads from URL
export function ReportModalProvider() {
  const { data: session } = useSession();
  const { isOpen, reportData, closeReport } = useReportModal();
  const [reportBody, setReportBody] = useState("");
  const [loading, setLoading] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: sendReport } = api.report.send.useMutation({
    onSuccess: () => {
      toast.success("Report submitted successfully");
      closeReport();
      setReportBody("");
    },
    onError: () => {
      toast.error("Failed to submit report. Please try again.");
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // New mutation for storing reports in database (shows in admin dashboard)
  const { mutate: createReport } = api.report.create.useMutation({
    onSuccess: () => {
      toast.success("Report submitted successfully");
      closeReport();
      setReportBody("");
    },
    onError: (error) => {
      if (error.message === "You have already reported this item") {
        toast.error("You have already reported this item");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReportBody("");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !reportData) return;

    if (!session) {
      signIn();
      return;
    }

    setLoading(true);

    const { type, id } = reportData;

    if (type === "post") {
      sendReport({
        type: "post",
        body: reportBody,
        id: id as string,
      });
    } else if (type === "discussion") {
      // Use new create mutation for discussions - stores in DB and shows in admin dashboard
      createReport({
        discussionId: id as number,
        reason: "OTHER",
        details: reportBody || undefined,
      });
    } else if (type === "comment") {
      // Legacy comments still use send (email)
      sendReport({
        type: "comment",
        body: reportBody,
        id: id as number,
      });
    } else if (type === "article") {
      sendReport({
        type: "article",
        body: reportBody,
        id: id as number,
      });
    }
  };

  if (!isOpen || !reportData) return null;

  const { type } = reportData;
  const contentLabel =
    type === "post" ? "article" : type === "article" ? "feed article" : "comment";

  return (
    <Dialog
      open={isOpen}
      onClose={closeReport}
      initialFocus={textAreaRef}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          <button
            onClick={closeReport}
            aria-label="Close modal"
            className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            Report {contentLabel}
          </DialogTitle>

          <Description as="div" className="mt-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Is something inappropriate? Help us keep the community safe by
              reporting content that violates our guidelines.
            </p>
          </Description>

          <form onSubmit={handleSubmit} className="mt-6">
            <label
              htmlFor="report-comment"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              What&apos;s the issue? (optional)
            </label>
            <textarea
              maxLength={500}
              id="report-comment"
              rows={4}
              placeholder="Describe the issue..."
              onChange={(e) => setReportBody(e.target.value)}
              value={reportBody}
              className="mt-2 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              ref={textAreaRef}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeReport}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Button component to trigger report
type ReportButtonProps = {
  type: ReportType;
  id: string | number;
  variant?: "icon" | "text" | "menu";
  className?: string;
};

export function ReportButton({
  type,
  id,
  variant = "icon",
  className = "",
}: ReportButtonProps) {
  const { data: session } = useSession();
  const { openReport } = useReportModal();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      signIn();
      return;
    }
    openReport(type, id);
  };

  if (variant === "icon") {
    return (
      <button
        aria-label="Report content"
        onClick={handleClick}
        className={`rounded-full p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 ${className}`}
      >
        <FlagIcon className="h-5 w-5" />
      </button>
    );
  }

  if (variant === "menu") {
    return (
      <button
        onClick={handleClick}
        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 ${className}`}
      >
        <FlagIcon className="h-4 w-4" />
        Report
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 ${className}`}
    >
      <FlagIcon className="h-4 w-4" />
      Report
    </button>
  );
}

// Legacy export for backwards compatibility
export const ReportModal = ({
  type,
  id,
  title,
  comment,
}: ReportItem & { title?: string; comment?: string }) => {
  const { data: session } = useSession();
  const { openReport } = useReportModal();

  const isCommentLike = type === "comment" || type === "discussion";

  const handleClick = () => {
    if (!session) {
      signIn();
      return;
    }
    openReport(type, id);
  };

  if (isCommentLike) {
    return (
      <button
        aria-label="Flag comment"
        onClick={handleClick}
        className="mr-4 flex rounded-full p-1.5 hover:bg-neutral-300 dark:hover:bg-neutral-800"
      >
        <FlagIcon className="h-5 fill-neutral-400 dark:fill-neutral-600" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full rounded px-2 py-1 text-left text-neutral-900 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
    >
      Report Article
    </button>
  );
};
