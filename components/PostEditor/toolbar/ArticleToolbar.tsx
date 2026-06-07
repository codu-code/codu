"use client";

import type { Editor } from "@tiptap/react";
import { useState, useCallback, useRef, type ChangeEvent } from "react";

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
          ? "bg-accent/15 text-accent"
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
  placeholder?: string;
}

function UrlInput({
  onSubmit,
  onCancel,
  placeholder = "Enter URL...",
}: LinkInputProps) {
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
      className="flex items-center gap-2 rounded-md border border-hairline bg-elevated px-3 py-1.5"
    >
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="w-64 border-none bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none"
        autoFocus
      />
      <button
        type="submit"
        className="text-sm font-medium text-accent transition-colors hover:text-accent-soft"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-muted transition-colors hover:text-fg"
      >
        Cancel
      </button>
    </form>
  );
}

// SVG Icons
const icons = {
  bold: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5Zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5ZM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8Z" />
    </svg>
  ),
  italic: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15v2Z" />
    </svg>
  ),
  strikethrough: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.154 14c.23.516.346 1.09.346 1.72 0 1.342-.524 2.392-1.571 3.147C14.88 19.622 13.433 20 11.586 20c-1.64 0-3.263-.381-4.87-1.144v-2.696c1.522.893 3.108 1.34 4.758 1.34.826 0 1.461-.133 1.904-.399.443-.266.664-.632.664-1.097 0-.377-.135-.71-.405-.999a3.06 3.06 0 0 0-.909-.62l-.123-.055H3v-2h18v2h-3.846ZM7.5 10c-.238-.377-.357-.81-.357-1.3 0-.645.122-1.212.367-1.7.245-.49.594-.896 1.046-1.22.453-.325.993-.567 1.62-.727.628-.16 1.323-.24 2.085-.24.847 0 1.548.064 2.104.193.556.129 1.093.282 1.612.459l-.756 2.29c-.383-.163-.8-.293-1.249-.39a6.705 6.705 0 0 0-1.48-.146c-.74 0-1.3.106-1.68.318a1.01 1.01 0 0 0-.57.916c0 .333.125.617.375.85.25.233.602.435 1.057.607l.171.062H7.5Z" />
    </svg>
  ),
  link: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.364 15.536 16.95 14.12l1.414-1.414a5 5 0 1 0-7.071-7.071L9.879 7.05 8.464 5.636 9.88 4.222a7 7 0 0 1 9.9 9.9l-1.415 1.414Zm-2.828 2.828-1.415 1.414a7 7 0 0 1-9.9-9.9l1.415-1.414L7.05 9.88l-1.414 1.414a5 5 0 1 0 7.071 7.071l1.414-1.414 1.415 1.414Zm-.708-10.607 1.415 1.415-7.071 7.07-1.415-1.414 7.071-7.07Z" />
    </svg>
  ),
  bulletList: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 4h13v2H8V4ZM4.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm0 6.9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM8 11h13v2H8v-2Zm0 7h13v2H8v-2Z" />
    </svg>
  ),
  orderedList: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 4h13v2H8V4ZM5 3v3h1v1H3V6h1V4H3V3h2Zm-2 7h3.5v1H4v1h1.5v1H3v-4Zm2 6v3h1v1H3v-1h1v-1H3v-1h1v-1H3v-1h2v1Zm4-3h13v2H9v-2Zm0 7h13v2H9v-2Z" />
    </svg>
  ),
  blockquote: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
    </svg>
  ),
  code: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12ZM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657L7.07 7.757 2.828 12Zm6.96 9H7.66l6.552-18h2.128L9.788 21Z" />
    </svg>
  ),
  codeBlock: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h16V5H4Zm16 7-3.536 3.536-1.414-1.414L17.172 12l-2.122-2.122 1.414-1.414L20 12ZM6.828 12l2.122 2.122-1.414 1.414L4 12l3.536-3.536 1.414 1.414L6.828 12Zm4.416 5H9.116l3.64-10h2.128l-3.64 10Z" />
    </svg>
  ),
  heading1: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 20h-2v-7H4v7H2V4h2v7h7V4h2v16Zm8-12v12h-2v-9.796l-2 .536V8.67L19.5 8H21Z" />
    </svg>
  ),
  heading2: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4v7h7V4h2v16h-2v-7H4v7H2V4h2Zm14.5 4c2.071 0 3.75 1.679 3.75 3.75 0 .857-.288 1.648-.772 2.28l-.148.18L18.034 18H22v2h-7v-1.556l4.82-5.546c.268-.307.43-.709.43-1.148 0-.966-.784-1.75-1.75-1.75-.918 0-1.671.707-1.744 1.606l-.006.144h-2C14.75 9.679 16.429 8 18.5 8Z" />
    </svg>
  ),
  heading3: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 8l-.002 2-2.505-.002c.93.701 1.507 1.79 1.507 3.002 0 2.071-1.679 3.75-3.75 3.75-2.071 0-3.75-1.679-3.75-3.75h2c0 .966.784 1.75 1.75 1.75s1.75-.784 1.75-1.75-.784-1.75-1.75-1.75H15v-2h2.25c.966 0 1.75-.784 1.75-1.75S18.216 5.75 17.25 5.75 15.5 6.534 15.5 7.5h-2c0-2.071 1.679-3.75 3.75-3.75S21 5.429 21 7.5c0 .857-.288 1.648-.772 2.28l-.148.18L22 8ZM4 4v7h7V4h2v16h-2v-7H4v7H2V4h2Z" />
    </svg>
  ),
  image: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.828 21l-.02.02-.021-.02H2.992A.993.993 0 0 1 2 20.007V3.993A1 1 0 0 1 2.992 3h18.016c.548 0 .992.445.992.993v16.014a1 1 0 0 1-.992.993H4.828ZM20 15V5H4v14L14 9l6 6Zm0 2.828l-6-6L6.828 19H20v-1.172ZM8 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
    </svg>
  ),
  horizontalRule: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 11h2v2H2v-2Zm4 0h12v2H6v-2Zm14 0h2v2h-2v-2Z" />
    </svg>
  ),
  youtube: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.244 4c.534.003 1.87.016 3.29.073l.504.022c1.429.067 2.857.183 3.566.38 1.035.28 1.85 1.119 2.12 2.178.466 1.819.476 5.245.476 5.347v.003c0 .1-.01 3.521-.476 5.344a3.03 3.03 0 0 1-2.12 2.178c-.709.197-2.137.313-3.566.38l-.504.022c-1.42.057-2.756.07-3.29.073H11.76c-.564-.003-2.037-.018-3.58-.085l-.377-.018c-1.497-.073-2.994-.195-3.726-.394-1.035-.28-1.85-1.119-2.12-2.178C1.488 15.5 1.478 12.078 1.478 12v-.003c0-.102.01-3.528.476-5.347a3.03 3.03 0 0 1 2.12-2.178c.732-.199 2.229-.32 3.726-.394l.377-.018c1.543-.067 3.016-.082 3.58-.085h.487ZM9.999 8.5v7l6-3.5-6-3.5Z" />
    </svg>
  ),
};

interface ArticleToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => void;
  onSwitchToMarkdown?: () => void;
}

export function ArticleToolbar({
  editor,
  onImageUpload,
  onSwitchToMarkdown,
}: ArticleToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddLink = useCallback(
    (url: string) => {
      if (editor) {
        editor.chain().focus().setLink({ href: url }).run();
      }
      setShowLinkInput(false);
    },
    [editor],
  );

  const handleAddYoutube = useCallback(
    (url: string) => {
      if (editor) {
        editor.chain().focus().setYoutubeVideo({ src: url }).run();
      }
      setShowYoutubeInput(false);
    },
    [editor],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImageUpload) {
        onImageUpload(file);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImageUpload],
  );

  if (!editor) return null;

  if (showLinkInput) {
    return (
      <div className="border-b border-hairline bg-inset p-2">
        <UrlInput
          onSubmit={handleAddLink}
          onCancel={() => setShowLinkInput(false)}
          placeholder="Enter link URL..."
        />
      </div>
    );
  }

  if (showYoutubeInput) {
    return (
      <div className="border-b border-hairline bg-inset p-2">
        <UrlInput
          onSubmit={handleAddYoutube}
          onCancel={() => setShowYoutubeInput(false)}
          placeholder="Enter YouTube URL..."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-inset px-3 py-2">
      <div className="flex flex-wrap items-center gap-0.5">
        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          {icons.heading1}
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          {icons.heading2}
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          {icons.heading3}
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          {icons.bold}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          {icons.italic}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          {icons.strikethrough}
        </ToolbarButton>

        <ToolbarDivider />

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
          {icons.link}
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image"
        >
          {icons.image}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          {icons.bulletList}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          {icons.orderedList}
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          {icons.blockquote}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code"
        >
          {icons.code}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          {icons.codeBlock}
        </ToolbarButton>

        <ToolbarDivider />

        {/* Special elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          {icons.horizontalRule}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowYoutubeInput(true)}
          title="YouTube Video"
        >
          {icons.youtube}
        </ToolbarButton>
      </div>

      {/* Switch to Markdown */}
      {onSwitchToMarkdown && (
        <button
          type="button"
          onClick={onSwitchToMarkdown}
          className="flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-soft"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v14h16V5H4Zm3 10.5H5v-7h2l2 2.5 2-2.5h2v7h-2v-4l-2 2.5-2-2.5v4Zm11-3h2l-3 3-3-3h2V8h2v4.5Z" />
          </svg>
          Switch to Markdown
        </button>
      )}
    </div>
  );
}
