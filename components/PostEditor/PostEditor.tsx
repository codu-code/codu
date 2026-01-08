"use client";

import { useState, useCallback } from "react";
import { WriteTab } from "./tabs/WriteTab";
import { LinkTab } from "./tabs/LinkTab";
import { TagInput } from "./components/TagInput";
import type { LinkMetadata } from "./hooks/useLinkMetadata";
import { PenLine, Link as LinkIcon } from "lucide-react";

export type PostType = "write" | "link";

interface PostEditorProps {
  /** Initial content for the Write tab */
  initialContent?: string;
  /** Initial title */
  initialTitle?: string;
  /** Initial tags */
  initialTags?: string[];
  /** Initial URL for Link tab */
  initialUrl?: string;
  /** Initial post type/tab */
  initialTab?: PostType;
  /** Callback when content changes */
  onContentChange?: (data: PostEditorData) => void;
  /** Callback when save/publish is requested */
  onSave?: (data: PostEditorData) => void;
  /** Callback when publish is requested */
  onPublish?: (data: PostEditorData) => void;
  /** Whether the editor is in loading state */
  isLoading?: boolean;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Last saved time string */
  lastSaved?: string;
  /** Show tags input */
  showTags?: boolean;
  /** Additional class name */
  className?: string;
}

export interface PostEditorData {
  type: PostType;
  title: string;
  body: string;
  tags: string[];
  // Link-specific fields
  externalUrl?: string;
  coverImage?: string | null;
  excerpt?: string | null;
  readTime?: number | null;
}

const TAB_CONFIG = [
  {
    id: "write" as const,
    label: "Write",
    icon: PenLine,
    description: "Write an article with rich text or markdown",
  },
  {
    id: "link" as const,
    label: "Link",
    icon: LinkIcon,
    description: "Share an external link with the community",
  },
];

export function PostEditor({
  initialContent = "",
  initialTitle = "",
  initialTags = [],
  initialUrl = "",
  initialTab = "write",
  onContentChange,
  onSave,
  onPublish,
  isLoading = false,
  isSaving = false,
  lastSaved,
  showTags = true,
  className = "",
}: PostEditorProps) {
  // State
  const [activeTab, setActiveTab] = useState<PostType>(initialTab);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);

  // Link tab state
  const [linkUrl, setLinkUrl] = useState(initialUrl);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);

  // Build current data object
  const getCurrentData = useCallback((): PostEditorData => {
    if (activeTab === "link") {
      return {
        type: "link",
        title: linkTitle || title,
        body: "", // Links don't have body content
        tags,
        externalUrl: linkUrl,
        coverImage: linkMetadata?.image,
        excerpt: linkMetadata?.description,
        readTime: linkMetadata?.readTime,
      };
    }

    return {
      type: "write",
      title,
      body,
      tags,
    };
  }, [activeTab, title, body, tags, linkUrl, linkTitle, linkMetadata]);

  // Handlers
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      onContentChange?.(getCurrentData());
    },
    [onContentChange, getCurrentData],
  );

  const handleBodyChange = useCallback(
    (newBody: string) => {
      setBody(newBody);
      onContentChange?.(getCurrentData());
    },
    [onContentChange, getCurrentData],
  );

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      onContentChange?.(getCurrentData());
    },
    [onContentChange, getCurrentData],
  );

  const handleLinkUrlChange = useCallback(
    (url: string) => {
      setLinkUrl(url);
      onContentChange?.(getCurrentData());
    },
    [onContentChange, getCurrentData],
  );

  const handleLinkTitleChange = useCallback(
    (newTitle: string) => {
      setLinkTitle(newTitle);
      onContentChange?.(getCurrentData());
    },
    [onContentChange, getCurrentData],
  );

  const handleMetadataFetched = useCallback((metadata: LinkMetadata) => {
    setLinkMetadata(metadata);
  }, []);

  const handleSave = useCallback(() => {
    onSave?.(getCurrentData());
  }, [onSave, getCurrentData]);

  const handlePublish = useCallback(() => {
    onPublish?.(getCurrentData());
  }, [onPublish, getCurrentData]);

  // Check if form is valid for the current tab
  const isValid =
    activeTab === "write"
      ? title.trim().length > 0
      : linkUrl.trim().length > 0 && linkTitle.trim().length > 0;

  if (isLoading) {
    return (
      <div
        className={`flex min-h-[600px] items-center justify-center ${className}`}
      >
        <div className="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
          <span>Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[600px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      {/* Tab Bar */}
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-pink-600 dark:text-pink-500"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
                title={tab.description}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 dark:bg-pink-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Save status */}
        <div className="ml-auto flex items-center gap-4 px-4">
          {lastSaved && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {isSaving ? "Saving..." : `Saved ${lastSaved}`}
            </span>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "write" ? (
          <WriteTab
            initialContent={initialContent}
            title={title}
            onTitleChange={handleTitleChange}
            onBodyChange={handleBodyChange}
            className="flex-1"
          />
        ) : (
          <LinkTab
            url={linkUrl}
            onUrlChange={handleLinkUrlChange}
            title={linkTitle}
            onTitleChange={handleLinkTitleChange}
            onMetadataFetched={handleMetadataFetched}
            className="flex-1"
          />
        )}

        {/* Tags (shared between tabs) */}
        {showTags && (
          <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
            <TagInput
              tags={tags}
              onChange={handleTagsChange}
              maxTags={5}
              label="Tags"
              helpText="Add up to 5 tags to help readers find your post."
            />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/50">
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
        )}
        {onPublish && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isValid || isSaving}
            className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activeTab === "link" ? "Share Link" : "Publish"}
          </button>
        )}
      </div>
    </div>
  );
}
