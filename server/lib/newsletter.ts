import * as Sentry from "@sentry/nextjs";

export async function manageNewsletterSubscription(
  email: string,
  action: "subscribe" | "unsubscribe",
): Promise<{ message: string } | undefined> {
  const EMAIL_API_ENDPOINT = process.env.EMAIL_API_ENDPOINT;
  const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
  const EMAIL_NEWSLETTER_ID = process.env.EMAIL_NEWSLETTER_ID;

  if (!EMAIL_API_ENDPOINT || !EMAIL_API_KEY || !EMAIL_NEWSLETTER_ID) {
    throw new Error("Email API not configured");
  }

  const payload = new URLSearchParams({
    email,
    api_key: EMAIL_API_KEY,
    list: EMAIL_NEWSLETTER_ID,
    boolean: "true",
    silent: "true", // Don't send a confirmation email (using this option for users signed up to platform, not newsletter only option)
  }).toString();

  const response = await fetch(`${EMAIL_API_ENDPOINT}/${action}`, {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });

  if (response.ok) {
    return { message: `Successfully ${action}d to the newsletter.` };
  } else {
    throw new Error(`Failed to ${action} to the newsletter`);
  }
}

export async function isUserSubscribedToNewsletter(email: string) {
  const EMAIL_API_ENDPOINT = process.env.EMAIL_API_ENDPOINT;
  const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
  const EMAIL_NEWSLETTER_ID = process.env.EMAIL_NEWSLETTER_ID;

  if (!EMAIL_API_ENDPOINT || !EMAIL_API_KEY || !EMAIL_NEWSLETTER_ID) {
    throw new Error("Email API not configured");
  }

  const payload = new URLSearchParams({
    email,
    api_key: EMAIL_API_KEY,
    list_id: EMAIL_NEWSLETTER_ID,
  }).toString();

  const response = await fetch(
    `${EMAIL_API_ENDPOINT}/api/subscribers/subscription-status.php`,
    {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      body: payload,
    },
  );

  if (response.ok) {
    const status = await response.text();
    return status === "Subscribed";
  } else {
    throw new Error("Failed to check newsletter subscription");
  }
}
