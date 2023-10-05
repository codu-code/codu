import { useCallback, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export interface Hotkey {
  key: string;
  useShift: boolean;
  markup: string;
  type: string;
}

type Hotkeys = {
  [name: string]: Hotkey;
};

// Define hotkeys, markup, and it is +metaKey or
export const hotkeys: Record<string, Hotkey> = {
  selectPrevious: {
    key: "backspace",
    useShift: false,
    markup: "",
    type: "select",
  },
  "heading 1": { key: "1", useShift: false, markup: "# ", type: "pre" },
  "heading 2": { key: "2", useShift: false, markup: "## ", type: "pre" },
  "heading 3": { key: "3", useShift: false, markup: "### ", type: "pre" },
  "heading 4": { key: "4", useShift: false, markup: "#### ", type: "pre" },
  "heading 5": { key: "5", useShift: false, markup: "##### ", type: "pre" },
  "heading 6": { key: "6", useShift: false, markup: "###### ", type: "pre" },
  bold: { key: "b", useShift: false, markup: "**", type: "wrap" },
  italic: { key: "i", useShift: false, markup: "_", type: "wrap" },
  boldItalic: { key: "b", useShift: true, markup: "***", type: "wrap" },
  codeSnippet: { key: "s", useShift: false, markup: "`", type: "wrap" },
  codeBlock: { key: "c", useShift: true, markup: "```", type: "wrap" },
  blockQuote: { key: ".", useShift: true, markup: ">", type: "blockQuote" },
  link: {
    key: "l",
    useShift: false,
    markup: "[text](url)",
    type: "linkOrImage",
  },
  image: {
    key: "i",
    useShift: true,
    markup: "![text](url)",
    type: "linkOrImage",
  },
  url: { key: "u", useShift: false, markup: "<>", type: "wrap" },
};

export const useMarkdownHotkeys = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
) => {
  // Create a single callback for all hotkeys
  const handleHotkey = useCallback(
    (hotkey: Hotkey) => (e: KeyboardEvent) => {
      e.preventDefault();
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const currentValue = textarea.value;
        const { markup, type } = hotkey;
        let newText;

        switch (type) {
          case "pre":
            newText = `${markup}${currentValue.slice(startPos, endPos)}`;
            break;

          case "wrap":
            // check for codeBlock, url then default wrap
            if (hotkey.key === "c" && hotkey.useShift) {
              newText = `${markup}\n\n${markup}`;
            } else if (hotkey.key === "u") {
              newText = `${markup[0]}${currentValue.slice(startPos, endPos)}${
                markup[1]
              }`;
            } else {
              newText = `${markup}${currentValue.slice(
                startPos,
                endPos,
              )}${markup}`;
            }
            break;

          case "blockQuote":
            const lines = currentValue.slice(startPos, endPos).split("\n");
            const quotedLines = lines.map((line) => `${markup} ${line}`);
            newText = quotedLines.join("\n");
            break;

          case "linkOrImage":
            const selectedText = currentValue.slice(startPos, endPos);
            if (!selectedText) return; // Do nothing if no text is selected

            const url = prompt("Enter the URL:");
            if (!url) return;

            const tag = markup
              .replace("text", selectedText)
              .replace("url", url);
            textarea.value = `${currentValue.slice(
              0,
              startPos,
            )}${tag}${currentValue.slice(endPos)}`;
            const cursorPos = startPos + tag.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
            return;

          case "select":
            let start = startPos - 1;

            // Move left while the cursor is on whitespace
            while (start >= 0 && /\s/.test(currentValue[start])) {
              start--;
            }

            // Move left while the cursor is on non-whitespace
            while (start >= 0 && /\S/.test(currentValue[start])) {
              start--;
            }

            start++; // Move to the beginning of the word

            // Trim right whitespace
            let trimmedEnd = endPos;
            while (/\s/.test(currentValue[trimmedEnd - 1])) {
              trimmedEnd--;
            }
            textarea.setSelectionRange(start, trimmedEnd);
            return;

          default:
            setSelectCount(0);
            return;
        }

        textarea.value = `${currentValue.slice(
          0,
          startPos,
        )}${newText}${currentValue.slice(endPos)}`;
        const cursorPos =
          type === "wrap" && hotkey.key === "c" && hotkey.useShift
            ? startPos + markup.length + 1
            : startPos + newText.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }
    },
    [],
  );

  // Map each hotkey to its corresponding callback
  Object.values(hotkeys).forEach((hotkey) => {
    useHotkeys(
      `${hotkey.key}${hotkey.useShift ? "+meta+shift" : "+meta"}`,
      handleHotkey(hotkey),
      { enableOnFormTags: true },
    );
  });
};
