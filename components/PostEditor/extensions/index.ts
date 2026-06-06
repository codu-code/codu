import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import { Markdown } from "tiptap-markdown";
import { InputRule } from "@tiptap/core";
import { common, createLowlight } from "lowlight";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Highlight.js styles imported in global CSS

/**
 * TipTap extensions configured for article/post editing.
 * Extends the discussion editor with headings, images, code highlighting, and YouTube embeds.
 */
export const getArticleExtensions = (
  placeholder: string = "Start writing your article...",
) => [
  StarterKit.configure({
    // Disable built-in heading - we use custom one for more control
    heading: false,
    // Disable built-in horizontal rule - we use custom one
    horizontalRule: false,
    // Disable built-in code block - we use CodeBlockLowlight for syntax highlighting
    codeBlock: false,
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside ml-6 my-4",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside ml-6 my-4",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal my-1",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class:
          "border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 my-4 italic text-neutral-600 dark:text-neutral-400",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-neutral-800 dark:text-neutral-200",
      },
    },
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
  }),

  // Headings H1-H3 for article structure
  Heading.configure({
    levels: [1, 2, 3],
    HTMLAttributes: {
      class: "font-bold",
    },
  }).extend({
    // Custom rendering for different heading levels
    renderHTML({ node, HTMLAttributes }) {
      const level = node.attrs.level;
      const classes: Record<number, string> = {
        1: "text-3xl font-bold mt-8 mb-4",
        2: "text-2xl font-bold mt-6 mb-3",
        3: "text-xl font-semibold mt-4 mb-2",
      };
      return [
        `h${level}`,
        { ...HTMLAttributes, class: classes[level] || "" },
        0,
      ];
    },
  }),

  // Horizontal rule with custom input rules
  HorizontalRule.extend({
    addInputRules() {
      return [
        new InputRule({
          find: /^(?:---|—-|___\s|\*\*\*\s)$/,
          handler: ({ state, range }) => {
            const { tr } = state;
            const start = range.from;
            const end = range.to;
            tr.insert(start - 1, this.type.create({})).delete(
              tr.mapping.map(start),
              tr.mapping.map(end),
            );
          },
        }),
      ];
    },
  }).configure({
    HTMLAttributes: {
      class: "my-8 border-t border-neutral-200 dark:border-neutral-700",
    },
  }),

  // Links with styling
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class:
        "text-accent dark:text-accent underline underline-offset-2 hover:text-accent dark:hover:text-accent cursor-pointer transition-colors",
    },
  }),

  // Superscript for footnotes, etc.
  Superscript,

  // Image extension (basic - upload handling done separately)
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: { default: null },
        height: { default: null },
        alt: { default: "" },
      };
    },
  }).configure({
    HTMLAttributes: {
      class: "rounded-lg max-w-full my-4",
    },
    allowBase64: true,
  }),

  // Code blocks with syntax highlighting
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class:
        "rounded-lg bg-neutral-900 dark:bg-neutral-950 p-4 font-mono text-sm overflow-x-auto my-4",
    },
  }),

  // YouTube embeds
  Youtube.configure({
    width: 640,
    height: 360,
    allowFullscreen: true,
    HTMLAttributes: {
      class: "rounded-lg my-4 aspect-video w-full",
    },
  }),

  // Placeholder text
  Placeholder.configure({
    placeholder: ({ editor }) => {
      const isEmpty = editor.state.doc.textContent.length === 0;
      return isEmpty ? placeholder : "";
    },
    showOnlyWhenEditable: true,
    emptyEditorClass:
      "before:content-[attr(data-placeholder)] before:text-neutral-400 dark:before:text-neutral-500 before:float-left before:h-0 before:pointer-events-none",
  }),

  // Markdown support for copy/paste and conversion
  Markdown.configure({
    html: false,
    transformCopiedText: true,
    transformPastedText: true,
  }),
];

export type ArticleEditorExtensions = ReturnType<typeof getArticleExtensions>;
