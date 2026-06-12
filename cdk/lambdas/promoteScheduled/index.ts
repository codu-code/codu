import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Thin invoker: on a schedule, POST the app's cron route (which does the actual
// promotion). This Lambda only authenticates with CRON_SECRET and reports back.

const ssmClient = new SSMClient({ region: "eu-west-1" });

// Read a decrypted SecureString from SSM (matches rssFetcher's `/env/...` convention).
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

// Site base URL from the required `/env/siteUrl` param. FAIL CLOSED: a missing
// or unreadable param throws (visible Lambda failure) rather than falling back
// to production — otherwise a non-prod deploy would silently POST prod.
async function getBaseUrl(): Promise<string> {
  const value = await getSsmValue("/env/siteUrl");
  return value.replace(/\/+$/, "");
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
