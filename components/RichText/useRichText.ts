"use client";

import { useCallback, useRef, useState } from "react";
import { md, type MdTool } from "./markdown";

/**
 * Selection-aware markdown editing state for the rich-text composer.
 * Storage is ALWAYS markdown — `exec` applies a toolbar transform around the
 * textarea's current selection, then restores the new selection.
 */
export function useRichText(initial = "") {
  const [text, setText] = useState(initial);
  const [toolbar, setToolbar] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const exec = useCallback((tool: MdTool) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const result = md[tool](el.value, start, end);
    setText(result.text);
    // Restore selection after React commits the new value.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.start, result.end);
    });
  }, [text.length]);

  return { text, setText, toolbar, setToolbar, ref, exec };
}

export type UseRichText = ReturnType<typeof useRichText>;
