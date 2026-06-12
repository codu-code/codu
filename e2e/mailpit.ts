/**
 * Helpers for asserting on email in E2E runs via the local Mailpit catcher
 * (docker-compose `mailpit` service). The app routes mail here when the dev
 * server runs with EMAIL_PROVIDER=local; tests poll the REST API instead of
 * relying on real delivery.
 *
 * API docs: https://mailpit.axllent.org/docs/api-v1/
 */

// Default matches the codu-mailpit host mapping in docker-compose.yml.
const MAILPIT_URL = process.env.MAILPIT_URL || "http://localhost:8027";

export interface MailpitMessageSummary {
  ID: string;
  To: { Address: string; Name: string }[];
  From: { Address: string; Name: string };
  Subject: string;
  Snippet: string;
}

/** True when the Mailpit container is reachable — used to skip email specs. */
export async function isMailpitRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${MAILPIT_URL}/api/v1/info`);
    return res.ok;
  } catch {
    return false;
  }
}

/** Delete every captured message (start specs from a clean inbox). */
export async function clearMailbox(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
}

export async function listMessages(): Promise<MailpitMessageSummary[]> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
  if (!res.ok) throw new Error(`Mailpit list failed: ${res.status}`);
  const body = (await res.json()) as { messages: MailpitMessageSummary[] };
  return body.messages ?? [];
}

/** Full message body (HTML + text) for link extraction. */
export async function getMessage(
  id: string,
): Promise<{ HTML: string; Text: string; Subject: string }> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
  if (!res.ok) throw new Error(`Mailpit message fetch failed: ${res.status}`);
  return (await res.json()) as { HTML: string; Text: string; Subject: string };
}

/**
 * Poll until an email to `address` (optionally matching `subjectContains`)
 * arrives, or time out. Returns the message summary.
 */
export async function waitForEmail(
  address: string,
  opts: { subjectContains?: string; timeoutMs?: number } = {},
): Promise<MailpitMessageSummary> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const messages = await listMessages();
    const match = messages.find(
      (m) =>
        m.To.some(
          (t) => t.Address.toLowerCase() === address.toLowerCase(),
        ) &&
        (!opts.subjectContains ||
          m.Subject.toLowerCase().includes(opts.subjectContains.toLowerCase())),
    );
    if (match) return match;
    if (Date.now() > deadline) {
      throw new Error(
        `No email to ${address}${opts.subjectContains ? ` matching "${opts.subjectContains}"` : ""} within ${timeoutMs}ms`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}
