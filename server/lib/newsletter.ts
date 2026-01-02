import * as Sentry from "@sentry/nextjs";

const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

interface BeehiivSubscription {
  id: string;
  email: string;
  status: "validating" | "active" | "inactive" | "pending";
  created_at: number;
}

interface BeehiivResponse {
  data: BeehiivSubscription;
}

function getBeehiivConfig() {
  const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
  const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID;

  if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
    throw new Error("Beehiiv API not configured");
  }

  return { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID };
}

export async function manageNewsletterSubscription(
  email: string,
  action: "subscribe" | "unsubscribe",
): Promise<{ message: string } | undefined> {
  const { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID } = getBeehiivConfig();

  if (action === "subscribe") {
    const response = await fetch(
      `${BEEHIIV_API_BASE}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
        }),
      },
    );

    if (response.ok) {
      return { message: "Successfully subscribed to the newsletter." };
    } else {
      const errorData = await response.text();
      Sentry.captureMessage(`Beehiiv subscribe failed: ${errorData}`);
      throw new Error("Failed to subscribe to the newsletter");
    }
  } else {
    // Unsubscribe: First get subscription by email, then update it
    const encodedEmail = encodeURIComponent(email);
    const getResponse = await fetch(
      `${BEEHIIV_API_BASE}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions/by_email/${encodedEmail}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
      },
    );

    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        return { message: "Successfully unsubscribed from the newsletter." };
      }
      throw new Error("Failed to find subscription");
    }

    const subscriptionData: BeehiivResponse = await getResponse.json();
    const subscriptionId = subscriptionData.data.id;

    const updateResponse = await fetch(
      `${BEEHIIV_API_BASE}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions/${subscriptionId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          unsubscribe: true,
        }),
      },
    );

    if (updateResponse.ok) {
      return { message: "Successfully unsubscribed from the newsletter." };
    } else {
      throw new Error("Failed to unsubscribe from the newsletter");
    }
  }
}

export async function isUserSubscribedToNewsletter(
  email: string,
): Promise<boolean> {
  const { BEEHIIV_API_KEY, BEEHIIV_PUBLICATION_ID } = getBeehiivConfig();

  const encodedEmail = encodeURIComponent(email);

  const response = await fetch(
    `${BEEHIIV_API_BASE}/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions/by_email/${encodedEmail}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${BEEHIIV_API_KEY}`,
      },
    },
  );

  if (response.ok) {
    const data: BeehiivResponse = await response.json();
    return data.data.status === "active";
  } else if (response.status === 404) {
    return false;
  } else {
    throw new Error("Failed to check newsletter subscription");
  }
}
