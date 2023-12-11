import StarterKit from "@tiptap/starter-kit";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Markdown } from "tiptap-markdown";
import Highlight from "@tiptap/extension-highlight";
import SlashCommand from "./slash-command";
import { InputRule } from "@tiptap/core";
// import UploadImagesPlugin from "@/components/editor/editor/plugins/upload-images";
import UpdatedImage from "./updated-image";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Youtube from "@tiptap/extension-youtube";
import UpdatedYoutube from "./update-youtube";

import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { ReactNodeViewRenderer, NodeViewProps } from "@tiptap/react";
import CustomTableNodeView from "../components/Table/CustomTableNodeView";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";
const lowlight = createLowlight(common);

// Highlight syntax select your style from here (https://highlightjs.org/examples)
import "highlight.js/styles/monokai-sublime.css";

import CodeBlock from "../components/CodeBlock/CodeBlock";

// const CustomImage = TiptapImage.extend({
//   addProseMirrorPlugins() {
//     return [UploadImagesPlugin()];
//   },
// });

const CustomDocument = Document.extend({
  content: "heading block*",
});

export const CustomCodeBlockEdit = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlock);
  },
}).configure({ lowlight });

// Two CodeBlockNodes need to be created to disable selector menu
export const CustomCodeBlockReadOnly = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => (
      <CodeBlock {...props} readOnly />
    ));
  },
}).configure({ lowlight });

export const CustomTable = Table.extend({
  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => (
      <CustomTableNodeView {...props} />
    ));
  },
});
export const TiptapExtensions = [
  CustomDocument,
  CustomTable,
  // Table.configure({
  //   HTMLAttributes: {
  //     class: "bg-neutral-100 w-full  overflow-scroll",
  //   },
  // }),
  TableRow.configure({
    HTMLAttributes: {
      class: "bg-neutral-900 border border-neutral-500 bg-red-500 flex-1 flex",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class:
        "text-neutral-900 bg-neutral-300 border border-neutral-500 flex-1 flex text-center p-1",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class:
        "text-neutral-900 bg-neutral-100 border border-neutral-500 flex-1 flex p-1",
    },
  }),
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
        return "Add a title to your post here!";
      }

      return "type / to see a list of formatting features";
    },
  }),
  SlashCommand,
  TiptapUnderline,
  TextStyle,
  Color,
  Link.configure({
    HTMLAttributes: {
      class:
        "text-stone-400 underline underline-offset-[3px] hover:text-stone-600 transition-colors cursor-pointer",
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  Markdown.configure({
    html: false,
    transformCopiedText: true,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Subscript,
  Superscript,
  // margin controlled in global.css
  Youtube.configure({
    width: 480,
    height: 320,
    allowFullscreen: true,
  }),
];
