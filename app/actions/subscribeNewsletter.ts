"use server";

import { z } from "zod";
import { headers } from "next/headers";
import * as Sentry from "@sentry/nextjs";
import { manageNewsletterSubscription } from "@/server/lib/newsletter";
import { rateLimit, clientIpFromHeaders } from "@/server/lib/rateLimit";

const emailSchema = z.string().email();

/**
 * On-site newsletter capture — subscribes the email to beehiiv directly so we
 * never bounce a cold visitor off-site. Degrades gracefully when beehiiv isn't
 * configured (e.g. local dev) so the capture UX is still testable.
 */
export async function subscribeToNewsletter(
  email: string,
): Promise<{ ok: boolean; message: string }> {
  const parsed = emailSchema.safeParse(email.trim());
  if (!parsed.success) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  // Public, unauthenticated endpoint — throttle per client IP so it can't be
  // scripted to exhaust the beehiiv quota or email-bomb addresses.
  const ip = clientIpFromHeaders(await headers());
  const { success } = await rateLimit({
    key: `newsletter-subscribe:${ip}`,
    limit: 3,
    windowMs: 3_600_000,
  });
  if (!success) {
    return {
      ok: false,
      message: "Too many attempts. Please try again later.",
    };
  }

  try {
    await manageNewsletterSubscription(parsed.data, "subscribe");
    return { ok: true, message: "You're in — check your inbox to confirm." };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Beehiiv API not configured"
    ) {
      // Local/dev without beehiiv keys — don't block the flow.
      return {
        ok: true,
        message: "Subscribed! (dev: beehiiv not configured)",
      };
    }
    Sentry.captureException(error);
    return {
      ok: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
