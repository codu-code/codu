"use client";

import { useEffect } from "react";
import { useLinkMetadata, type LinkMetadata } from "../hooks/useLinkMetadata";
import { UrlMetadataPreview } from "../components/UrlMetadataPreview";
import { Link as LinkIcon } from "lucide-react";

interface LinkTabProps {
  /** Current URL value */
  url: string;
  /** Callback when URL changes */
  onUrlChange: (url: string) => void;
  /** Current title value */
  title: string;
  /** Callback when title changes */
  onTitleChange: (title: string) => void;
  /** Callback when metadata is fetched (to update parent state) */
  onMetadataFetched?: (metadata: LinkMetadata) => void;
  /** Placeholder for URL input */
  urlPlaceholder?: string;
  /** Placeholder for title input */
  titlePlaceholder?: string;
  /** Additional class name for container */
  className?: string;
}

export function LinkTab({
  url,
  onUrlChange,
  title,
  onTitleChange,
  onMetadataFetched,
  urlPlaceholder = "https://example.com/article",
  titlePlaceholder = "Link title (auto-populated from URL)",
  className = "",
}: LinkTabProps) {
  const { metadata, isLoading, error, refetch } = useLinkMetadata(url, {
    onSuccess: (data) => {
      // Auto-populate title if empty
      if (!title && data.title) {
        onTitleChange(data.title);
      }
      onMetadataFetched?.(data);
    },
  });

  // Update title when metadata changes (if title is still empty)
  useEffect(() => {
    if (metadata?.title && !title) {
      onTitleChange(metadata.title);
    }
  }, [metadata?.title, title, onTitleChange]);

  return (
    <div className={`flex flex-col gap-6 p-6 ${className}`}>
      {/* URL Input */}
      <div>
        <label htmlFor="link-url" className="eyebrow mb-2 block">
          <span className="slash">{"// "}</span>Link URL{" "}
          <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <LinkIcon className="h-5 w-5 text-faint" />
          </div>
          <input
            id="link-url"
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlPlaceholder}
            className="w-full rounded-md border border-hairline bg-canvas py-3 pl-10 pr-4 text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <p className="mt-1.5 text-sm text-faint">
          Paste a URL and we&apos;ll automatically fetch the title, description,
          and preview image.
        </p>
      </div>

      {/* Metadata Preview */}
      {(url.length > 10 || isLoading || error || metadata) && (
        <div>
          <label className="eyebrow mb-2 block">
            <span className="slash">{"// "}</span>Link Preview
          </label>
          <UrlMetadataPreview
            metadata={metadata}
            isLoading={isLoading}
            error={error}
            url={url}
            onRetry={refetch}
          />
        </div>
      )}

      {/* Title Input */}
      <div>
        <label htmlFor="link-title" className="eyebrow mb-2 block">
          <span className="slash">{"// "}</span>Title{" "}
          <span className="text-accent">*</span>
        </label>
        <input
          id="link-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full rounded-md border border-hairline bg-canvas px-4 py-3 text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <p className="mt-1.5 text-sm text-faint">
          Edit the title or use the auto-populated one from the link.
        </p>
      </div>

      {/* Info Box */}
      <div className="rounded-md border border-hairline bg-inset p-4">
        <div className="flex gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-fg">Sharing a link</p>
            <p className="mt-1 text-muted">
              Link posts are great for sharing interesting articles, resources,
              or tools you&apos;ve found. The community can discuss and comment
              on the shared content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
