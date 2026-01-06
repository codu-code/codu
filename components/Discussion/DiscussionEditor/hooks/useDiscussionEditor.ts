"use client";

import { useState, useCallback, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { getDiscussionExtensions } from "../extensions";
import type { EditorMode } from "../types";

interface UseDiscussionEditorOptions {
  initialContent?: string;
  autoExpand?: boolean;
  placeholder?: string;
  onSubmit: (markdown: string) => Promise<void>;
}

export function useDiscussionEditor({
  initialContent = "",
  autoExpand = false,
  placeholder = "What are your thoughts?",
  onSubmit,
}: UseDiscussionEditorOptions) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [mode, setMode] = useState<EditorMode>("rich");
  const [markdownContent, setMarkdownContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: getDiscussionExtensions(placeholder),
    content: initialContent,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  // Sync initial content when editor is ready
  useEffect(() => {
    if (editor && initialContent && !editor.getText().trim()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const toggleMode = useCallback(() => {
    if (!editor) return;

    if (mode === "rich") {
      // Rich -> Markdown: Get markdown from TipTap
      const markdown =
        editor.storage.markdown?.getMarkdown() || editor.getText();
      setMarkdownContent(markdown);
      setMode("markdown");
    } else {
      // Markdown -> Rich: Set TipTap content from markdown
      editor.commands.setContent(markdownContent);
      setMode("rich");
    }
  }, [mode, editor, markdownContent]);

  const expand = useCallback(() => {
    setIsExpanded(true);
    // Focus editor after expanding
    setTimeout(() => editor?.commands.focus(), 50);
  }, [editor]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    // Reset content
    editor?.commands.clearContent();
    setMarkdownContent("");
    setMode("rich");
  }, [editor]);

  const getMarkdown = useCallback((): string => {
    if (mode === "markdown") {
      return markdownContent;
    }
    if (editor) {
      return editor.storage.markdown?.getMarkdown() || editor.getText();
    }
    return "";
  }, [mode, markdownContent, editor]);

  const isEmpty = useCallback((): boolean => {
    const content = getMarkdown().trim();
    return content.length === 0;
  }, [getMarkdown]);

  const handleSubmit = useCallback(async () => {
    const markdown = getMarkdown().trim();
    if (!markdown) return;

    setIsSubmitting(true);
    try {
      await onSubmit(markdown);
      // Reset after successful submit
      editor?.commands.clearContent();
      setMarkdownContent("");
      setMode("rich");
      if (!autoExpand) {
        setIsExpanded(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [getMarkdown, onSubmit, editor, autoExpand]);

  const handleCancel = useCallback(() => {
    editor?.commands.clearContent();
    setMarkdownContent("");
    setMode("rich");
    if (!autoExpand) {
      setIsExpanded(false);
    }
  }, [editor, autoExpand]);

  return {
    editor,
    isExpanded,
    mode,
    markdownContent,
    isSubmitting,
    setMarkdownContent,
    toggleMode,
    expand,
    collapse,
    getMarkdown,
    isEmpty,
    handleSubmit,
    handleCancel,
  };
}
