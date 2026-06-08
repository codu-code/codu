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
        className="w-full rounded-lg border border-hairline bg-inset px-4 py-3 text-left text-muted transition-colors hover:border-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder}
      </button>
    );
  }

  // Expanded state
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface focus-within:border-strong">
      {/* Rich text mode */}
      {mode === "rich" && (
        <>
          {/* Toolbar row - only show when showToolbar is true */}
          {showToolbar && (
            <div className="flex items-center justify-between border-b border-hairline bg-inset px-3 py-2">
              <DiscussionEditorToolbar editor={editor} />
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 whitespace-nowrap text-xs text-accent-soft hover:text-accent hover:underline"
              >
                Switch to Markdown
              </button>
            </div>
          )}

          {/* Editor content */}
          <EditorContent
            editor={editor}
            className="min-h-[60px] text-fg [&_.ProseMirror:focus]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-1.5 [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none"
          />
        </>
      )}

      {/* Markdown mode */}
      {mode === "markdown" && (
        <>
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-hairline bg-inset px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted">
                Markdown Editor
              </span>
              <button
                type="button"
                onClick={() => setShowMarkdownHelp(true)}
                className="text-faint transition-colors hover:text-fg"
                aria-label="Markdown help"
              >
                <InformationCircleIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-accent-soft hover:text-accent hover:underline"
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
            className="w-full resize-y border-none bg-transparent px-3 py-1.5 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-0"
          />
        </>
      )}

      {/* Action buttons row */}
      <div className="flex items-center justify-between border-t border-hairline bg-inset px-3 py-2">
        {/* Format toggle button (Aa) - only in rich text mode */}
        {mode === "rich" ? (
          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            className={`font-serif text-lg transition-colors ${
              showToolbar
                ? "text-accent-soft"
                : "text-faint hover:text-fg"
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
            className="px-4 py-1.5 text-sm text-muted transition-colors hover:text-fg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isEmpty()}
            className="primary-button px-4 py-1.5 text-sm"
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
