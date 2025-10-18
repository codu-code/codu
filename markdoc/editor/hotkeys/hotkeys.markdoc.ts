import { useCallback, useEffect, useRef } from "react";
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
  const currentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const handlerRef = useRef<(e: KeyboardEvent) => void>();

  // Create a single callback for all hotkeys
  const handleHotkey = useCallback(
    (hotkey: Hotkey) => (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const textarea = textareaRef.current;
      if (!textarea) return;
      
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
    },
    [textareaRef],
  );

  useEffect(() => {
    handlerRef.current = (e: KeyboardEvent) => {
      // Check if it's a meta/ctrl key combination
      if (!e.metaKey && !e.ctrlKey) return;

      // Find matching hotkey
      const matchingHotkey = Object.values(hotkeys).find((hotkey) => {
        const isCorrectKey = e.key === hotkey.key;
        const hasCorrectShift = hotkey.useShift ? e.shiftKey : !e.shiftKey;
        return isCorrectKey && hasCorrectShift;
      });

      if (matchingHotkey) {
        handleHotkey(matchingHotkey)(e);
      }
    };
  }, [handleHotkey]);

  useEffect(() => {
    const textarea = textareaRef.current;
    
    if (textarea === currentTextareaRef.current) return;
    
    // Clean up previous event listener
    if (currentTextareaRef.current && handlerRef.current) {
      currentTextareaRef.current.removeEventListener('keydown', handlerRef.current);
    }
    
    // Set up new event listener if textarea exists
    if (textarea && handlerRef.current) {
      textarea.addEventListener('keydown', handlerRef.current);
      currentTextareaRef.current = textarea;
    } else {
      currentTextareaRef.current = null;
    }

    return () => {
      if (currentTextareaRef.current && handlerRef.current) {
        currentTextareaRef.current.removeEventListener('keydown', handlerRef.current);
        currentTextareaRef.current = null;
      }
    };
  });
};
