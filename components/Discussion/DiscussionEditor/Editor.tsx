"use client";

import { useState } from "react";
import { EditorContent } from "@tiptap/react";
import TextareaAutosize from "react-textarea-autosize";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { useDiscussionEditor } from "./hooks/useEditor";
import { DiscussionEditorToolbar } from "./Toolbar";
import { MarkdownHelpModal } from "./MarkdownHelpModal";
import type { DiscussionEditorProps } from "./types";

export function DiscussionEditor({
  onSubmit,
  onCancel,
  initialContent = "",
  autoExpand = false,
  placeholder = "Join the conversation...",
  submitLabel = "Comment",
  disabled = false,
}: DiscussionEditorProps) {
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);

  const {
    editor,
    isExpanded,
    mode,
    markdownContent,
    isSubmitting,
    setMarkdownContent,
    toggleMode,
    expand,
    handleSubmit,
    handleCancel,
    isEmpty,
  } = useDiscussionEditor({
    initialContent,
    autoExpand,
    placeholder: "What are your thoughts?",
    onSubmit,
  });

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={expand}
        disabled={disabled}
        className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-left text-neutral-500 transition-colors hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600"
      >
        {placeholder}
      </button>
    );
  }

  // Expanded state
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white focus-within:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:focus-within:border-neutral-500">
      {/* Rich text mode */}
      {mode === "rich" && (
        <>
          {/* Toolbar row - only show when showToolbar is true */}
          {showToolbar && (
            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
              <DiscussionEditorToolbar editor={editor} />
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 whitespace-nowrap text-xs text-accent hover:text-accent hover:underline"
              >
                Switch to Markdown
              </button>
            </div>
          )}

          {/* Editor content */}
          <EditorContent
            editor={editor}
            className="min-h-[60px] [&_.ProseMirror:focus]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-1.5 [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none"
          />
        </>
      )}

      {/* Markdown mode */}
      {mode === "markdown" && (
        <>
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Markdown Editor
              </span>
              <button
                type="button"
                onClick={() => setShowMarkdownHelp(true)}
                className="text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label="Markdown help"
              >
                <InformationCircleIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-accent hover:text-accent hover:underline"
            >
              Switch to Rich Text Editor
            </button>
          </div>

          {/* Textarea */}
          <TextareaAutosize
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            placeholder="What are your thoughts?"
            minRows={2}
            className="w-full resize-y border-none bg-transparent px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 dark:text-white"
          />
        </>
      )}

      {/* Action buttons row */}
      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        {/* Format toggle button (Aa) - only in rich text mode */}
        {mode === "rich" ? (
          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            className={`font-serif text-lg transition-colors ${
              showToolbar
                ? "text-accent"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
            title={
              showToolbar
                ? "Hide formatting toolbar"
                : "Show formatting toolbar"
            }
          >
            Aa
          </button>
        ) : (
          <div />
        )}

        {/* Cancel and Submit buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              handleCancel();
              onCancel?.();
            }}
            disabled={isSubmitting}
            className="px-4 py-1.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isEmpty()}
            className="rounded-full bg-gradient-to-r from-accent to-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:from-accent hover:to-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      </div>

      {/* Markdown help modal */}
      <MarkdownHelpModal
        open={showMarkdownHelp}
        onClose={() => setShowMarkdownHelp(false)}
      />
    </div>
  );
}
