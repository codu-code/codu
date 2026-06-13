/**
 * The app's public origin (scheme + host, NO path). Use for app-facing links in
 * emails. NEXTAUTH_URL carries a /api/auth path which must be stripped — using it
 * directly produced .../api/auth/admin/moderation (bug).
 */
export function getAppOrigin(): string {
  const domain = process.env.DOMAIN_NAME || process.env.VERCEL_URL;
  if (domain) return `https://${domain.replace(/^https?:\/\//, "")}`;
  const raw = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3000";
}
