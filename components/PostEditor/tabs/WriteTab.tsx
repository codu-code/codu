"use client";

import { EditorContent } from "@tiptap/react";
import TextareaAutosize from "react-textarea-autosize";
import { ArticleToolbar } from "../toolbar/ArticleToolbar";
import { useArticleEditor, type EditorMode } from "../hooks/useArticleEditor";
import { useRef, type ChangeEvent } from "react";
import { ImageUp } from "lucide-react";
import copy from "copy-to-clipboard";
import { toast } from "sonner";

interface WriteTabProps {
  /** Initial markdown content to load */
  initialContent?: string;
  /** Callback when title changes */
  onTitleChange?: (title: string) => void;
  /** Callback when body content changes (debounced) */
  onBodyChange?: (markdown: string) => void;
  /** Current title value */
  title?: string;
  /** Placeholder for title input */
  titlePlaceholder?: string;
  /** Placeholder for editor */
  editorPlaceholder?: string;
  /** Additional class name for container */
  className?: string;
}

export function WriteTab({
  initialContent = "",
  onTitleChange,
  onBodyChange,
  title = "",
  titlePlaceholder = "Article title",
  editorPlaceholder = "Start writing your article...",
  className = "",
}: WriteTabProps) {
  const {
    editor,
    mode,
    markdownContent,
    setMarkdownContent,
    toggleMode,
    uploadImage,
  } = useArticleEditor({
    initialContent,
    placeholder: editorPlaceholder,
    onContentChange: onBodyChange,
  });

  const markdownFileInputRef = useRef<HTMLInputElement>(null);

  const handleMarkdownImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For markdown mode, we'll handle the upload separately
      // This would insert the markdown image syntax after upload
      uploadImage(file);
    }
    if (markdownFileInputRef.current) {
      markdownFileInputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Title Input */}
      <div className="border-b border-hairline">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder={titlePlaceholder}
          className="w-full border-none bg-transparent px-4 py-4 font-display text-3xl font-extrabold tracking-tight text-fg placeholder:text-faint focus:outline-none focus:ring-0 sm:text-4xl"
        />
      </div>

      {/* Editor */}
      {mode === "rich" ? (
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <ArticleToolbar
            editor={editor}
            onImageUpload={uploadImage}
            onSwitchToMarkdown={toggleMode}
          />

          {/* TipTap Editor */}
          <div className="flex-1 overflow-y-auto bg-surface">
            <EditorContent
              editor={editor}
              className="min-h-[300px] [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Markdown Mode Header */}
          <div className="flex items-center justify-between border-b border-hairline bg-inset px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Image Upload for Markdown Mode */}
              <label
                htmlFor="markdown-image-upload"
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-hairline bg-surface px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <ImageUp className="h-4 w-4" />
                Upload Image
              </label>
              <input
                ref={markdownFileInputRef}
                id="markdown-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleMarkdownImageUpload}
                className="hidden"
              />

              {/* Markdown Help Link */}
              <a
                href="https://www.markdownguide.org/cheat-sheet/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-fg"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                Markdown Guide
              </a>
            </div>

            {/* Switch to Rich Text */}
            <button
              type="button"
              onClick={toggleMode}
              className="flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-soft"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.9 6.858l4.242 4.243L7.242 21H3v-4.243l9.9-9.9Zm1.414-1.414l2.121-2.122a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414l-2.122 2.121-4.242-4.242Z" />
              </svg>
              Switch to Rich Text
            </button>
          </div>

          {/* Markdown Textarea */}
          <div className="flex-1 bg-surface">
            <TextareaAutosize
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              placeholder={editorPlaceholder}
              minRows={20}
              className="w-full resize-none border-none bg-transparent px-4 py-4 font-mono text-base text-fg placeholder:text-faint focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export types for use in parent components
export type { EditorMode };
