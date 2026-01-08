"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useEditor, type Editor } from "@tiptap/react";
import { getArticleExtensions } from "../extensions";
import {
  S3ImageUploadPlugin,
  handleImageDrop,
  handleImagePaste,
  triggerImageUpload,
} from "../extensions/s3-image-upload";

export type EditorMode = "rich" | "markdown";

interface UseArticleEditorOptions {
  /** Initial markdown content to load */
  initialContent?: string;
  /** Placeholder text for empty editor */
  placeholder?: string;
  /** Callback when content changes (debounced) */
  onContentChange?: (markdown: string) => void;
  /** Debounce delay in ms for content change callback */
  debounceMs?: number;
}

interface UseArticleEditorReturn {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Current editor mode */
  mode: EditorMode;
  /** Markdown content (for markdown mode) */
  markdownContent: string;
  /** Set markdown content directly */
  setMarkdownContent: (content: string) => void;
  /** Toggle between rich and markdown modes */
  toggleMode: () => void;
  /** Get current content as markdown */
  getMarkdown: () => string;
  /** Check if editor is empty */
  isEmpty: () => boolean;
  /** Clear editor content */
  clearContent: () => void;
  /** Set content from markdown */
  setContent: (markdown: string) => void;
  /** Trigger image upload from file input */
  uploadImage: (file: File) => void;
}

export function useArticleEditor({
  initialContent = "",
  placeholder = "Start writing your article...",
  onContentChange,
  debounceMs = 1500,
}: UseArticleEditorOptions = {}): UseArticleEditorReturn {
  const [mode, setMode] = useState<EditorMode>("rich");
  const [markdownContent, setMarkdownContent] = useState(initialContent);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(initialContent);

  const editor = useEditor({
    extensions: getArticleExtensions(placeholder),
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 pt-2 pb-3 !mt-0 [&>*:first-child]:mt-0",
      },
      handleDrop: handleImageDrop,
      handlePaste: (view, event) => {
        // First try to handle image paste
        if (handleImagePaste(view, event)) {
          return true;
        }
        // Let TipTap handle other paste events (including markdown)
        return false;
      },
    },
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      // Register the upload plugin
      editor.registerPlugin(S3ImageUploadPlugin());
    },
    onUpdate: ({ editor }) => {
      // Debounced content change callback
      if (onContentChange && mode === "rich") {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          const markdown =
            editor.storage.markdown?.getMarkdown() || editor.getText();
          if (markdown !== lastContentRef.current) {
            lastContentRef.current = markdown;
            onContentChange(markdown);
          }
        }, debounceMs);
      }
    },
  });

  // Sync initial content when editor is ready
  useEffect(() => {
    if (editor && initialContent && !editor.getText().trim()) {
      editor.commands.setContent(initialContent);
      lastContentRef.current = initialContent;
    }
  }, [editor, initialContent]);

  // Debounced markdown content change callback
  useEffect(() => {
    if (onContentChange && mode === "markdown") {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (markdownContent !== lastContentRef.current) {
          lastContentRef.current = markdownContent;
          onContentChange(markdownContent);
        }
      }, debounceMs);
    }
  }, [markdownContent, mode, onContentChange, debounceMs]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const toggleMode = useCallback(() => {
    if (!editor) return;

    if (mode === "rich") {
      // Rich → Markdown: Extract markdown from TipTap
      const markdown =
        editor.storage.markdown?.getMarkdown() || editor.getText();
      setMarkdownContent(markdown);
      setMode("markdown");
    } else {
      // Markdown → Rich: Load markdown into TipTap
      editor.commands.setContent(markdownContent);
      setMode("rich");
    }
  }, [mode, editor, markdownContent]);

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

  const clearContent = useCallback(() => {
    editor?.commands.clearContent();
    setMarkdownContent("");
    lastContentRef.current = "";
  }, [editor]);

  const setContent = useCallback(
    (markdown: string) => {
      setMarkdownContent(markdown);
      lastContentRef.current = markdown;
      if (editor && mode === "rich") {
        editor.commands.setContent(markdown);
      }
    },
    [editor, mode],
  );

  const uploadImage = useCallback(
    (file: File) => {
      if (editor) {
        triggerImageUpload(editor.view, file);
      }
    },
    [editor],
  );

  return {
    editor,
    mode,
    markdownContent,
    setMarkdownContent,
    toggleMode,
    getMarkdown,
    isEmpty,
    clearContent,
    setContent,
    uploadImage,
  };
}
