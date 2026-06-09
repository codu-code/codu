import { lookup } from "node:dns/promises";

/**
 * SSRF guard for author-supplied URLs that the moderation pre-visit fetches.
 *
 * The classification of literal hostnames / IPs (isPubliclyFetchableHost) is a
 * pure, unit-tested function. For non-literal hostnames we additionally resolve
 * via DNS and reject if ANY resolved address falls in a blocked range — a
 * best-effort defence; it does NOT fully prevent DNS-rebinding (the address can
 * change between this lookup and the actual fetch, and "follow"ed redirects can
 * land on a fresh host). Callers should fail closed (skip the fetch) on doubt.
 */

const BLOCKED_HOST_SUFFIXES = [".internal", ".local"];

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0"]);

/** Parse an IPv4 dotted-quad into its 4 octets, or null if not IPv4. */
function parseIpv4(host: string): [number, number, number, number] | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const octets = m.slice(1, 5).map(Number) as [
    number,
    number,
    number,
    number,
  ];
  if (octets.some((o) => o < 0 || o > 255)) return null;
  return octets;
}

/** True if an IPv4 address is in a loopback/link-local/private/unspecified range. */
function isBlockedIpv4(octets: [number, number, number, number]): boolean {
  const [a, b] = octets;
  // 0.0.0.0/8 (incl. 0.0.0.0 "this host")
  if (a === 0) return true;
  // 127.0.0.0/8 loopback
  if (a === 127) return true;
  // 10.0.0.0/8 private
  if (a === 10) return true;
  // 169.254.0.0/16 link-local (incl. cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 private
  if (a === 192 && b === 168) return true;
  return false;
}

/**
 * True if an IPv6 address (normalised, lowercase) is loopback, unspecified,
 * link-local (fe80::/10), or unique-local (fc00::/7). Handles the IPv4-mapped
 * form (::ffff:a.b.c.d) by delegating to the IPv4 check.
 */
function isBlockedIpv6(host: string): boolean {
  let h = host.toLowerCase();
  // Strip a zone id, e.g. fe80::1%eth0
  const pct = h.indexOf("%");
  if (pct !== -1) h = h.slice(0, pct);

  if (h === "::1" || h === "::") return true;

  // IPv4-mapped / -compatible: ::ffff:1.2.3.4
  const mapped = h.match(/:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) {
    const v4 = parseIpv4(mapped[1]);
    if (v4) return isBlockedIpv4(v4);
  }

  // fe80::/10 link-local
  if (/^fe[89ab]/.test(h)) return true;
  // fc00::/7 unique-local (fc.. and fd..)
  if (/^f[cd]/.test(h)) return true;

  return false;
}

/** True if a literal IP string (v4 or v6) is in a blocked range. */
function isBlockedIp(host: string): boolean {
  const v4 = parseIpv4(host);
  if (v4) return isBlockedIpv4(v4);
  if (host.includes(":")) return isBlockedIpv6(host);
  return false;
}

/**
 * Pure classification of a hostname or literal IP. Returns false (NOT publicly
 * fetchable) for localhost, loopback, link-local, private, unique-local,
 * unspecified addresses, and `.internal`/`.local` suffixes. Returns true for
 * ordinary public hostnames and public literal IPs.
 *
 * This does NOT perform DNS resolution — a hostname that resolves to a private
 * IP still passes here. Use isHostFetchable() for the resolve-and-check variant.
 */
export function isPubliclyFetchableHost(hostname: string): boolean {
  if (!hostname) return false;
  // Strip IPv6 brackets, e.g. [::1]
  let host = hostname.trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }

  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) return false;
  if (isBlockedIp(host)) return false;

  return true;
}

/**
 * Resolve-and-check variant. Runs the pure classification first, then (for
 * non-literal hostnames) resolves the host and rejects if ANY resolved address
 * is in a blocked range. Fails closed: a resolution failure returns false.
 *
 * Residual risk: DNS rebinding between this lookup and the actual fetch is not
 * prevented; this is a pragmatic denylist, not a perfect anti-rebinding fortress.
 */
export async function isHostFetchable(hostname: string): Promise<boolean> {
  if (!isPubliclyFetchableHost(hostname)) return false;

  // If it's already a literal IP, the pure check above was authoritative.
  if (parseIpv4(hostname) || hostname.includes(":")) return true;

  try {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.length === 0) return false;
    for (const { address } of addresses) {
      if (isBlockedIp(address)) return false;
    }
    return true;
  } catch {
    // Fail closed — if we can't resolve, don't fetch.
    return false;
  }
}
