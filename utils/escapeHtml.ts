const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

// Allow only http(s) and mailto URLs. Used for href attributes — prevents
// javascript: and data: URIs that some email clients render as clickable.
export function sanitizeHref(url: string | undefined | null): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return "";
}
