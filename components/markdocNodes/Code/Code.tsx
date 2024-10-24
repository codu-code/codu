"use client";

import React, { useEffect } from "react";
import copy from "copy-to-clipboard";
import Prism from "prismjs";
import { DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/20/solid";

Prism.languages.ts = Prism.languages.js;
Prism.languages.jsx = Prism.languages.html;

Prism.languages.markdoc = {
  tag: {
    pattern: /{%(.|\n)*?%}/i,
    inside: {
      tagType: {
        pattern: /^({%\s*\/?)(\w*|-)*\b/i,
        lookbehind: true,
      },
      id: /#(\w|-)*\b/,
      string: /".*?"/,
      equals: /=/,
      number: /\b\d+\b/i,
      variable: {
        pattern: /\$[\w.]+/i,
        inside: {
          punctuation: /\./i,
        },
      },
      function: /\b\w+(?=\()/,
      punctuation: /({%|\/?%})/i,
      boolean: /false|true/,
    },
  },
  variable: {
    pattern: /\$\w+/i,
  },
  function: {
    pattern: /\b\w+(?=\()/i,
  },
};

interface Props {
  children: string;
  language: string;
}

export default function Code({ children, language }: Props) {
  const [copied, setCopied] = React.useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current, false);
  }, [children]);

  useEffect(() => {
    if (copied && ref && ref.current) {
      copy((ref.current as HTMLElement).innerText);
      const to = setTimeout(setCopied, 1000, false);
      return () => clearTimeout(to);
    }
  }, [copied]);

  const lang = language === "md" ? "markdoc" : language || "markdoc";

  const lines =
    typeof children === "string" ? children.split("\n").filter(Boolean) : [];

  return (
    <div className="code group" aria-live="polite">
      <pre key={children} ref={ref} className={`language-${lang}`}>
        {children}
      </pre>
      <button
        className="absolute flex h-8 w-8 items-center justify-center rounded-lg border border-gray-400 bg-gray-300 opacity-100 shadow-md transition-all ease-in-out group-hover:scale-100 group-hover:opacity-100 dark:border-gray-500 dark:bg-gray-700 md:scale-0 md:opacity-0"
        type="button"
        onClick={() => setCopied(true)}
      >
        {copied ? (
          <CheckIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <DocumentDuplicateIcon className="h-5 w-5 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300" />
        )}
      </button>
      <style jsx>
        {`
          .code {
            position: relative;
          }
          .code button {
            appearance: none;
            color: inherit;
            top: ${lines.length === 1 ? "17px" : "13px"};
            right: 11px;
          }
        `}
      </style>
    </div>
  );
}
