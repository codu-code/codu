const TRACKING = /^(utm_|ref$|ref_|fbclid$|gclid$|mc_|igshid$)/i;

/** Normalise an external URL for dedupe. Returns null if not http(s). */
export function normalizeUrl(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  u.hash = "";
  const keep = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (!TRACKING.test(k)) keep.append(k, v);
  keep.sort();
  u.search = keep.toString();
  let out = u.toString();
  if (out.endsWith("/") && u.pathname !== "/") out = out.slice(0, -1);
  return out;
}
