import { SITE_ORIGIN } from "@/config/site";

/**
 * The app's public origin (scheme + host, NO path). Use for app-facing links in
 * emails.
 *
 * Precedence matters, because two of these are per-deployment values:
 *
 * - DOMAIN_NAME is the explicit override; it wins everywhere.
 * - On a Vercel PRODUCTION deploy the origin must be the project's production
 *   domain. VERCEL_URL is NOT that — it is the unique per-deployment hostname
 *   (`codu-a1b2c3.vercel.app`) and Vercel sets it in production too, so
 *   preferring it there mailed people deployment URLs instead of codu.co.
 * - VERCEL_URL is still right for PREVIEW deploys, where a link should point
 *   back at the deployment that sent it.
 * - NEXTAUTH_URL carries an /api/auth path which must be stripped — using it
 *   directly produced .../api/auth/admin/moderation (bug).
 */
export function getAppOrigin(): string {
  const explicit = process.env.DOMAIN_NAME;
  if (explicit) return toOrigin(explicit);

  if (process.env.VERCEL_ENV === "production") {
    // Set by Vercel to the project's production domain in every environment.
    const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return productionDomain ? toOrigin(productionDomain) : SITE_ORIGIN;
  }

  const deployment = process.env.VERCEL_URL;
  if (deployment) return toOrigin(deployment);

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

// Env values arrive both bare (`www.codu.co`) and with a scheme.
function toOrigin(domain: string): string {
  return `https://${domain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
}
