// Selection-aware markdown transforms shared by the rich-text composer.
// Storage is ALWAYS markdown — every tool here returns a new value plus the
// selection range to restore, so the textarea can re-select the right text.

export interface MdSelection {
  /** Full text after the edit. */
  text: string;
  /** Selection start to restore. */
  start: number;
  /** Selection end to restore. */
  end: number;
}

interface Slice {
  before: string;
  selected: string;
  after: string;
}

const slice = (text: string, start: number, end: number): Slice => ({
  before: text.slice(0, start),
  selected: text.slice(start, end),
  after: text.slice(end),
});

/** Wrap the selection in `token` on each side; placeholder if empty. */
function wrap(
  text: string,
  start: number,
  end: number,
  token: string,
  placeholder: string,
): MdSelection {
  const { before, selected, after } = slice(text, start, end);
  const inner = selected || placeholder;
  return {
    text: `${before}${token}${inner}${token}${after}`,
    start: before.length + token.length,
    end: before.length + token.length + inner.length,
  };
}

/** Prefix every line of the selection (or the current line) with `prefix`. */
function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: (i: number) => string,
  placeholder: string,
): MdSelection {
  const { before, selected, after } = slice(text, start, end);
  const body = selected || placeholder;
  const out = body
    .split("\n")
    .map((line, i) => `${prefix(i)}${line}`)
    .join("\n");
  return {
    text: `${before}${out}${after}`,
    start: before.length,
    end: before.length + out.length,
  };
}

export const md = {
  bold: (t: string, s: number, e: number) => wrap(t, s, e, "**", "bold text"),
  italic: (t: string, s: number, e: number) =>
    wrap(t, s, e, "*", "italic text"),
  strike: (t: string, s: number, e: number) =>
    wrap(t, s, e, "~~", "struck text"),

  /** Strip common inline markdown tokens from the selection. */
  clear: (t: string, s: number, e: number): MdSelection => {
    const { before, selected, after } = slice(t, s, e);
    const cleaned = selected
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "");
    return {
      text: `${before}${cleaned}${after}`,
      start: before.length,
      end: before.length + cleaned.length,
    };
  },

  /** `[selection](url)` — selects the `url` placeholder for quick typing. */
  link: (t: string, s: number, e: number): MdSelection => {
    const { before, selected, after } = slice(t, s, e);
    const label = selected || "link text";
    const urlPh = "url";
    const head = `${before}[${label}](`;
    return {
      text: `${head}${urlPh})${after}`,
      start: head.length,
      end: head.length + urlPh.length,
    };
  },

  ul: (t: string, s: number, e: number) =>
    prefixLines(t, s, e, () => "- ", "list item"),
  ol: (t: string, s: number, e: number) =>
    prefixLines(t, s, e, (i) => `${i + 1}. `, "list item"),
  quote: (t: string, s: number, e: number) =>
    prefixLines(t, s, e, () => "> ", "quote"),

  /** Inline code for single-line selections; fenced block otherwise. */
  code: (t: string, s: number, e: number): MdSelection => {
    const { before, selected, after } = slice(t, s, e);
    const inner = selected || "code";
    if (!inner.includes("\n")) {
      const head = `${before}\``;
      return {
        text: `${head}${inner}\`${after}`,
        start: head.length,
        end: head.length + inner.length,
      };
    }
    const head = `${before}\`\`\`\n`;
    return {
      text: `${head}${inner}\n\`\`\`${after}`,
      start: head.length,
      end: head.length + inner.length,
    };
  },

  /** 3-row markdown table template; selects the first header cell. */
  table: (t: string, s: number, e: number): MdSelection => {
    const { before, after } = slice(t, s, e);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const head = `${before}${lead}| `;
    const cell = "Column 1";
    const tail =
      ` | Column 2 | Column 3 |\n| --- | --- | --- |\n` +
      `| Cell | Cell | Cell |\n| Cell | Cell | Cell |`;
    return {
      text: `${head}${cell}${tail}${after}`,
      start: head.length,
      end: head.length + cell.length,
    };
  },
};

export type MdTool = keyof typeof md;
