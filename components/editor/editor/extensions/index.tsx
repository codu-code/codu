import StarterKit from "@tiptap/starter-kit";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import { Markdown } from "tiptap-markdown";
import SlashCommand from "./slash-command";
import { InputRule } from "@tiptap/core";
import UpdatedImage from "./updated-image";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Youtube from "@tiptap/extension-youtube";

import type { NodeViewProps } from "@tiptap/react";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";
const lowlight = createLowlight(common);

// Highlight syntax select your style from here (https://highlightjs.org/examples)
import "highlight.js/styles/monokai-sublime.css";

import DisableHeadingTextStyleShortcuts from "./disable-heading-text-style-shortcuts";

// const CustomImage = TiptapImage.extend({
//   addProseMirrorPlugins() {
//     return [UploadImagesPlugin()];
//   },
// });

const CustomDocument = Document.extend({
  content: "heading block*",
});

export const TiptapExtensions = [
  CustomDocument,
  // Table.configure({
  //   HTMLAttributes: {
  //     class: "bg-neutral-100 w-full  overflow-scroll",
  //   },
  // }),
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
        class: "border-l-4 border-stone-700",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class:
          "rounded-sm bg-stone-100 p-5 font-mono font-medium text-stone-800",
      },
    },
    code: {
      HTMLAttributes: {
        class:
          "rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900",
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
  // patch to fix horizontal rule bug: https://github.com/ueberdosis/tiptap/pull/3859#issuecomment-1536799740
  HorizontalRule.extend({
    addInputRules() {
      return [
        new InputRule({
          find: /^(?:---|—-|___\s|\*\*\*\s)$/,
          handler: ({ state, range }) => {
            const attributes = {};

            const { tr } = state;
            const start = range.from;
            const end = range.to;

            tr.insert(start - 1, this.type.create(attributes)).delete(
              tr.mapping.map(start),
              tr.mapping.map(end),
            );
          },
        }),
      ];
    },
  }).configure({
    HTMLAttributes: {
      class: "mt-4 mb-6 border-t border-stone-300",
    },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class:
        "text-stone-400 underline underline-offset-[3px] hover:text-stone-600 transition-colors cursor-pointer",
    },
  }),
  // CustomImage.configure({
  //   allowBase64: true,
  //   HTMLAttributes: {
  //     class: "rounded-lg border border-stone-200",
  //   },
  // }),
  UpdatedImage.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-stone-200",
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading" && node.attrs.level == 1) {
        return "Title";
      }

      return "type / to see a list of formatting features";
    },
  }),
  TextStyle,
  Link.configure({
    HTMLAttributes: {
      class:
        "text-stone-400 underline underline-offset-[3px] hover:text-stone-600 transition-colors cursor-pointer",
    },
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true,
  }),
  // margin controlled in global.css
  Youtube.configure({
    width: 480,
    height: 320,
    allowFullscreen: true,
  }),
  DisableHeadingTextStyleShortcuts,
];
