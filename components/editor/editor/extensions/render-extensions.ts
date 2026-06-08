/**
 * Server-safe extensions for generateHTML() - no React/DOM dependencies
 * Use this for server-side rendering of Tiptap content (e.g., article pages)
 * For the editor, use TiptapExtensions from index.tsx instead
 */
import StarterKit from "@tiptap/starter-kit";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import { Markdown } from "tiptap-markdown";
import { InputRule } from "@tiptap/core";
import UpdatedImage from "./updated-image";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Youtube from "@tiptap/extension-youtube";

const CustomDocument = Document.extend({
  content: "heading block*",
});

export const RenderExtensions = [
  CustomDocument,
  Paragraph,
  Text,
  StarterKit.configure({
    document: false,
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-hairline",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class:
          "rounded-sm bg-inset p-5 font-mono font-medium text-fg",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "rounded-md bg-inset px-1.5 py-1 font-mono font-medium text-fg",
        spellcheck: "false",
      },
    },
    horizontalRule: false,
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
  }),
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
      class: "mt-4 mb-6 border-t border-hairline",
    },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class:
        "text-accent underline underline-offset-[3px] hover:text-accent-soft transition-colors cursor-pointer",
    },
  }),
  UpdatedImage.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-hairline",
    },
  }),
  TextStyle,
  Link.configure({
    HTMLAttributes: {
      class:
        "text-accent underline underline-offset-[3px] hover:text-accent-soft transition-colors cursor-pointer",
    },
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true,
  }),
  Youtube.configure({
    width: 480,
    height: 320,
    allowFullscreen: true,
  }),
];
