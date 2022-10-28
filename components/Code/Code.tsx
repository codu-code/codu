/* global Prism */

import * as React from "react";
import copy from "copy-to-clipboard";
import Prism from "prismjs";

const svgs = {
  copied: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <title>Copied</title>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M96,288L192,384L416,128"
      />
      <style jsx>
        {`
          path {
            stroke-dasharray: 477;
            stroke-dashoffset: 477;
            animation: draw 150ms ease-out forwards;
          }
          @keyframes draw {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}
      </style>
    </svg>
  ),
  copy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <title>Copy</title>
      <rect
        x="128"
        y="128"
        width="336"
        height="336"
        rx="57"
        ry="57"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="32"
      />
      <path
        d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
      />
    </svg>
  ),
};

function Icon({
  icon,
  color = "inherit",
}: {
  icon: "copy" | "copied";
  color: string;
}) {
  return (
    <span className="icon">
      {svgs[icon] || null}
      <style jsx>
        {`
          .icon {
            display: inline-block;
            position: relative;
            font-size: inherit;
            width: 1em;
            height: 1em;
            min-width: 16px;
            box-sizing: content-box;
            color: ${color};
          }
          .icon :global(svg) {
            z-index: 10; // make icons in callouts show correctly
            position: relative;
            display: block;
            fill: currentcolor;
            stroke: currentcolor;
            width: 100%;
            height: 100%;
          }
        `}
      </style>
    </span>
  );
}

Prism.languages.ts = Prism.languages.js
Prism.languages.jsx = Prism.languages.html

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

export default function Code({ children, language }: any) {
    
  const [copied, setCopied] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (ref.current) Prism.highlightElement(ref.current, false);
  }, [children]);

  React.useEffect(() => {
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
    <div className="code" aria-live="polite">
      <pre
        key={children}
        ref={ref}
        className={`language-${lang}`}
      >
        {children}
      </pre>
      <button onClick={() => setCopied(true)}>
        <Icon icon={copied ? "copied" : "copy"} color="#fb923c" />
      </button>
      <style jsx>
        {`
          .code {
            position: relative;
          }
          .code button {
            appearance: none;
            position: absolute;
            color: inherit;
            top: ${lines.length === 1 ? "17px" : "13px"};
            right: 11px;
            border-radius: 4px;
            border: none;
            font-size: 15px;
            background: #d9cdcd;
            padding: 2px 2px 0px 4px;
          }
        `}
      </style>
    </div>
  );
}
