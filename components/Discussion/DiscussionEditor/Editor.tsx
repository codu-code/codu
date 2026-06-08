"use client";

import { useEffect, useState } from "react";
import {
  AaToggle,
  MdTextarea,
  RichToolbar,
  useRichText,
} from "@/components/RichText";
import type { DiscussionEditorProps } from "./types";

/**
 * Markdown-first discussion composer. Storage is always markdown; the toolbar
 * wraps markdown tokens around the textarea selection. Keeps the collapsed
 * trigger behaviour and the onSubmit(markdown) + submitLabel contract so
 * DiscussionArea works unchanged.
 */
export function DiscussionEditor({
  onSubmit,
  onCancel,
  initialContent = "",
  autoExpand = false,
  placeholder = "Join the conversation...",
  submitLabel = "Comment",
  disabled = false,
}: DiscussionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { text, setText, toolbar, setToolbar, ref, exec } =
    useRichText(initialContent);

  // Focus the textarea once expanded.
  useEffect(() => {
    if (isExpanded) ref.current?.focus();
  }, [isExpanded, ref]);

  const reset = () => {
    setText(initialContent);
    setToolbar(false);
    if (!autoExpand) setIsExpanded(false);
  };

  const handleSubmit = async () => {
    const markdown = text.trim();
    if (!markdown || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(markdown);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Collapsed state — the trigger keeps the existing label text.
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className="w-full rounded-lg border border-hairline bg-inset px-4 py-3 text-left text-muted transition-colors hover:border-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        {placeholder}
      </button>
    );
  }

  const isEmpty = text.trim().length === 0;

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-surface focus-within:border-strong">
      <div className="flex flex-col gap-2 p-2.5">
        {toolbar && (
          <RichToolbar
            exec={exec}
            onSwitchToMarkdown={() => setToolbar(false)}
            compact
          />
        )}
        <MdTextarea
          ref={ref}
          value={text}
          onValueChange={setText}
          placeholder="What are your thoughts?"
          minRows={2}
          className="px-1"
        />
      </div>

      <div className="flex items-center justify-between border-t border-hairline bg-inset px-3 py-2">
        <AaToggle on={toolbar} onToggle={() => setToolbar(!toolbar)} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
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
            disabled={isSubmitting || isEmpty}
            className="primary-button px-4 py-1.5 text-sm"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
