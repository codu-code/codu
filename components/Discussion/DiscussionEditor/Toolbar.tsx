"use client";

import type { Editor } from "@tiptap/react";
import { useState, useCallback } from "react";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? "bg-accent/10 text-accent-soft"
          : "text-muted hover:bg-elevated hover:text-fg"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-hairline" />;
}

interface LinkInputProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

function LinkInput({ onSubmit, onCancel }: LinkInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded bg-inset px-2 py-1"
    >
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
        className="w-48 border-none bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        className="text-xs text-accent-soft hover:text-accent"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-muted hover:text-fg"
      >
        Cancel
      </button>
    </form>
  );
}

interface DiscussionEditorToolbarProps {
  editor: Editor | null;
}

export function DiscussionEditorToolbar({
  editor,
}: DiscussionEditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleAddLink = useCallback(
    (url: string) => {
      if (editor) {
        editor.chain().focus().setLink({ href: url }).run();
      }
      setShowLinkInput(false);
    },
    [editor],
  );

  const insertTable = useCallback(() => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  }, [editor]);

  if (!editor) return null;

  if (showLinkInput) {
    return (
      <LinkInput
        onSubmit={handleAddLink}
        onCancel={() => setShowLinkInput(false)}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {/* Bold */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z" />
        </svg>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z" />
        </svg>
      </ToolbarButton>

      {/* Strikethrough */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144v-2.696c1.522.893 3.108 1.34 4.758 1.34.826 0 1.461-.133 1.904-.399.443-.266.664-.632.664-1.097 0-.377-.135-.71-.405-.999a3.06 3.06 0 0 0-.909-.62l-.123-.055H3v-2h18v2h-3.846ZM7.5 10c-.238-.377-.357-.81-.357-1.3 0-.645.122-1.212.367-1.7.245-.49.594-.896 1.046-1.22.453-.325.993-.567 1.62-.727.628-.16 1.323-.24 2.085-.24.847 0 1.548.064 2.104.193.556.129 1.093.282 1.612.459l-.756 2.29c-.383-.163-.8-.293-1.249-.39a6.705 6.705 0 0 0-1.48-.146c-.74 0-1.3.106-1.68.318a1.01 1.01 0 0 0-.57.916c0 .333.125.617.375.85.25.233.602.435 1.057.607l.171.062H7.5Z" />
        </svg>
      </ToolbarButton>

      {/* Superscript */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        title="Superscript"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.596 5.004 10.5 11.5 5.596 18H8.68l3.322-4.5L15.319 18h3.085l-4.904-6.5 4.904-6.496h-3.085l-3.321 4.429-3.323-4.429H5.596ZM21 11h-5V9.5h5V11Zm0-5.5h-5V4h5v1.5Z" />
        </svg>
      </ToolbarButton>

      {/* Link */}
      <ToolbarButton
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            setShowLinkInput(true);
          }
        }}
        isActive={editor.isActive("link")}
        title="Link"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Bullet List */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z" />
        </svg>
      </ToolbarButton>

      {/* Numbered List */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.5v1H4v1h1.5v1H3v-4Zm2 6v3h1v1H3v-1h1v-1H3v-1h1v-1H3v-1h2v1Zm4-3h13v2H9v-2Zm0 7h13v2H9v-2Z" />
        </svg>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
        </svg>
      </ToolbarButton>

      {/* Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12ZM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12Zm6.96 9H7.66l6.552-18h2.128L9.788 21Z" />
        </svg>
      </ToolbarButton>

      {/* Table */}
      <ToolbarButton
        onClick={insertTable}
        isActive={editor.isActive("table")}
        title="Insert Table"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 3a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm1 2h6v5H5V5Zm8 0h6v5h-6V5Zm-8 7h6v7H5v-7Zm8 0h6v7h-6v-7Z" />
        </svg>
      </ToolbarButton>
    </div>
  );
}
