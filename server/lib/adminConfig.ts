/**
 * Admin Configuration Utility
 *
 * Provides utilities for managing admin access via environment variables.
 * Admin emails can be configured in .env as a comma-separated list.
 *
 * Example:
 *   ADMIN_EMAILS=admin@codu.co,moderator@codu.co
 */

/**
 * Get the list of admin emails from environment variables
 * @returns Array of lowercase admin email addresses
 */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
  return adminEmailsEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if an email is in the admin list
 * @param email - Email address to check
 * @returns true if the email is an admin email
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
