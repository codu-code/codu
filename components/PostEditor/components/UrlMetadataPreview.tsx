"use client";

import type { LinkMetadata } from "../hooks/useLinkMetadata";
import { Loader2, AlertCircle, Clock, ExternalLink } from "lucide-react";

interface UrlMetadataPreviewProps {
  /** Metadata to display */
  metadata: LinkMetadata | null;
  /** Whether metadata is being loaded */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** The URL being previewed */
  url: string;
  /** Callback to retry fetching */
  onRetry?: () => void;
}

export function UrlMetadataPreview({
  metadata,
  isLoading,
  error,
  url,
  onRetry,
}: UrlMetadataPreviewProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Fetching link preview...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Could not fetch link preview
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {error}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-sm font-medium text-amber-700 underline hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No metadata yet (URL might be invalid or empty)
  if (!metadata) {
    return null;
  }

  // Extract domain from URL
  let domain = "";
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch {
    // Ignore invalid URL
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
      {/* Cover Image */}
      {metadata.image && (
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          { }
          <img
            src={metadata.image}
            alt={metadata.title || "Link preview"}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Site name / Domain */}
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>{metadata.siteName || domain}</span>
          {metadata.readTime && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {metadata.readTime} min read
              </span>
            </>
          )}
        </div>

        {/* Title */}
        {metadata.title && (
          <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">
            {metadata.title}
          </h3>
        )}

        {/* Description */}
        {metadata.description && (
          <p className="mt-2 line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
            {metadata.description}
          </p>
        )}
      </div>
    </div>
  );
}
