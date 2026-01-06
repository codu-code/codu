import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Superscript from "@tiptap/extension-superscript";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";

export const getDiscussionExtensions = (
  placeholder: string = "What are your thoughts?",
) => [
  StarterKit.configure({
    heading: false,
    horizontalRule: false,
    codeBlock: {
      HTMLAttributes: {
        class:
          "rounded bg-neutral-100 dark:bg-neutral-800 p-3 font-mono text-sm",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "rounded bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 font-mono text-sm",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside ml-4",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside ml-4",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class:
          "border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic",
      },
    },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-pink-600 underline hover:text-pink-500 cursor-pointer",
    },
  }),
  Superscript,
  Table.configure({
    resizable: false,
    HTMLAttributes: {
      class: "border-collapse w-full my-2",
    },
  }),
  TableRow,
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-neutral-300 dark:border-neutral-600 p-2",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class:
        "border border-neutral-300 dark:border-neutral-600 p-2 bg-neutral-100 dark:bg-neutral-800 font-semibold",
    },
  }),
  Placeholder.configure({
    placeholder: ({ editor }) => {
      // Only show placeholder when editor is completely empty
      const isEmpty = editor.state.doc.textContent.length === 0;
      return isEmpty ? placeholder : "";
    },
    showOnlyWhenEditable: true,
    emptyEditorClass:
      "before:content-[attr(data-placeholder)] before:text-neutral-400 before:float-left before:h-0 before:pointer-events-none",
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true,
    transformPastedText: true,
  }),
];
