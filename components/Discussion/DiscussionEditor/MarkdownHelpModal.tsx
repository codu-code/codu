"use client";

import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui-components/dialog";
import { Button } from "@/components/ui-components/button";

const MARKDOWN_SYNTAX = [
  { syntax: "**bold**", result: "bold", style: "font-bold" },
  { syntax: "*italic*", result: "italic", style: "italic" },
  {
    syntax: "~~strikethrough~~",
    result: "strikethrough",
    style: "line-through",
  },
  {
    syntax: "^superscript",
    result: "superscript",
    style: "text-[0.7em] align-super",
  },
  { syntax: "[text](url)", result: "link", style: "text-blue-500 underline" },
  { syntax: "- item", result: "bullet list", style: "" },
  { syntax: "1. item", result: "numbered list", style: "" },
  {
    syntax: "> quote",
    result: "blockquote",
    style: "border-l-2 border-neutral-400 pl-2",
  },
  {
    syntax: "`code`",
    result: "inline code",
    style: "font-mono bg-neutral-200 dark:bg-neutral-700 px-1 rounded text-sm",
  },
  { syntax: "```\\ncode\\n```", result: "code block", style: "font-mono" },
];

interface MarkdownHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function MarkdownHelpModal({ open, onClose }: MarkdownHelpModalProps) {
  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogTitle className="flex items-center justify-between">
        <span>Markdown Help</span>
        <button
          onClick={onClose}
          className="rounded-full p-1 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636l4.95 4.95z" />
          </svg>
        </button>
      </DialogTitle>
      <DialogBody>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Markdown is a way to quickly format text using typed symbols instead
          of a toolbar.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                <th className="pb-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">
                  Type this
                </th>
                <th className="pb-2 font-medium text-neutral-600 dark:text-neutral-400">
                  To get this
                </th>
              </tr>
            </thead>
            <tbody>
              {MARKDOWN_SYNTAX.map(({ syntax, result, style }) => (
                <tr
                  key={syntax}
                  className="border-b border-neutral-100 dark:border-neutral-800"
                >
                  <td className="py-2 pr-4">
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-800">
                      {syntax}
                    </code>
                  </td>
                  <td className="py-2">
                    <span className={style}>{result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
