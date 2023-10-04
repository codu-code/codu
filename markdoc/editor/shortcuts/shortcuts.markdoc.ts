// useCustomShortcuts.tsx
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { RefObject } from "react";

type Shortcuts = {
  [name: string]: string;
};

export const markdownShortcuts: Shortcuts = {
  "/link": "[text](url)",
  "/image": "![text](url)",
};

export const customTagsShortcuts: Shortcuts = {
  "/media": '{% media src="" /%}',
  "/youtube": '{% youtube src="" /%}',
  "/codepen": '{% codepen src="" /%}',
  "/codesandbox": '{% codesandbox src="" /%}',
};

const insertCustomTag = (shortcut: string, textarea: HTMLTextAreaElement) => {
  const tag = customTagsShortcuts[shortcut];
  const currentValue = textarea.value;
  const startPos = textarea.selectionStart;

  textarea.value = `${currentValue.slice(
    0,
    startPos - shortcut.length,
  )}${tag}${currentValue.slice(startPos)}`;

  const cursorPos = startPos + tag.length - shortcut.length;
  textarea.setSelectionRange(cursorPos, cursorPos);
};

export const useMarkdownShortcuts = (
  textareaRef: RefObject<HTMLTextAreaElement>,
) => {
  const handleShortcut = useCallback(
    (e: KeyboardEvent) => {
      const textarea = textareaRef.current;
      const value = textarea.value;
      const startPos = textarea.selectionStart;

      for (const shortcut in customTagsShortcuts) {
        if (value.slice(startPos - shortcut.length, startPos) === shortcut) {
          e.preventDefault();

          // Prompt for URL
          const url = prompt("Enter the URL:");
          if (!url) return;

          const tag = customTagsShortcuts[shortcut].replace(
            'src=""',
            `src="${url}"`,
          );
          const currentValue = textarea.value;

          textarea.value = `${currentValue.slice(
            0,
            startPos - shortcut.length,
          )}${tag}${currentValue.slice(startPos)}`;
          const cursorPos = startPos + tag.length - shortcut.length;
          textarea.setSelectionRange(cursorPos, cursorPos);
          break;
        }
      }

      for (const shortcut in markdownShortcuts) {
        if (value.slice(startPos - shortcut.length, startPos) === shortcut) {
          e.preventDefault();
          const tagTemplate = markdownShortcuts[shortcut];

          if (shortcut === "/link" || shortcut === "/image") {
            // Prompt for text
            const text = prompt("Enter the text:");
            if (!text) return;

            // Prompt for URL
            const url = prompt("Enter the URL:");
            if (!url) return;

            const tag = tagTemplate.replace("text", text).replace("url", url);
            const currentValue = textarea.value;

            textarea.value = `${currentValue.slice(
              0,
              startPos - shortcut.length,
            )}${tag}${currentValue.slice(startPos)}`;
            const cursorPos = startPos + tag.length - shortcut.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
          }
          break;
        }
      }
    },
    [textareaRef],
  );

  useHotkeys("tab", handleShortcut, { enableOnFormTags: true });
};
