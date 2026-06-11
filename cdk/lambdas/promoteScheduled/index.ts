import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Thin invoker Lambda: on a schedule, call the production cron route that does
// the actual scheduled-post promotion + go-live side-effects. The promotion
// logic lives in the app (app/api/cron/promote-scheduled/route.ts); this Lambda
// only authenticates with the shared CRON_SECRET and reports the result.

const ssmClient = new SSMClient({ region: "eu-west-1" });

// Helper to get values from AWS SSM (matches rssFetcher's convention:
// SecureString params under the `/env/...` prefix, decrypted on read).
async function getSsmValue(secretName: string): Promise<string> {
  const params = {
    Name: secretName,
    WithDecryption: true,
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter not found: ${secretName}`);
    }
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

// Resolve the site base URL. Prefer the optional `/env/siteUrl` SSM param so the
// invoker can be pointed at a preview environment, but fall back to the stable
// production host when it isn't set.
async function getBaseUrl(): Promise<string> {
  try {
    const value = await getSsmValue("/env/siteUrl");
    return value.replace(/\/+$/, "");
  } catch {
    return "https://www.codu.co";
  }
}

// Main Lambda handler
exports.handler = async function () {
  console.log("Promote Scheduled invoker Lambda running");

  const secret = await getSsmValue("/env/cronSecret");
  const base = await getBaseUrl();
  const url = `${base}/api/cron/promote-scheduled`;

  console.log(`Invoking ${url}`);

  // Node 20 runtime ships a global fetch — no node-fetch dependency needed.
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  const body = await response.text();
  console.log(`Response ${response.status}: ${body}`);

  // Surface failures in CloudWatch so a broken route / bad secret is visible.
  if (!response.ok) {
    throw new Error(
      `promote-scheduled returned ${response.status}: ${body}`,
    );
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body,
  };
};
