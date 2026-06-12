// Shared relative-time formatter. Consolidates the getRelativeTime helpers
// that were previously copy-pasted (with drift) across the feed/saved cards,
// the profile page and the admin screens. Client-safe: no server imports.

/**
 * Short relative label for a date string: "just now", "5m ago", "3h ago",
 * "2d ago", then a locale date (e.g. "Mar 5") once it's a week or more old.
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
