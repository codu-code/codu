import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

// Mirrors utils/s3helpers.ts: these are the app IAM user's credentials
// (ACCESS_KEY / SECRET_KEY), NOT the standard AWS_ACCESS_KEY_ID env names.
// When the keys are absent (e.g. local/dev without creds) we omit the
// credentials block so the SDK's default provider chain can take over.
const hasKeys = process.env.ACCESS_KEY && process.env.SECRET_KEY;

export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || "eu-west-1",
  ...(hasKeys
    ? {
        credentials: {
          accessKeyId: process.env.ACCESS_KEY || "",
          secretAccessKey: process.env.SECRET_KEY || "",
        },
      }
    : {}),
});

// Never make a real model call from tests / E2E. Mirrors the isEmailMocked
// pattern in utils/sendEmail.ts: dev:e2e sets ENV=E2E; MOCK_BEDROCK is an
// explicit override. When mocked, isBedrockEnabled() is forced false so
// autoReview() falls back to the cheap heuristic instead of hitting Bedrock.
export const isBedrockMocked =
  process.env.ENV === "E2E" ||
  process.env.NODE_ENV === "test" ||
  process.env.MOCK_BEDROCK === "true";

/** True only when Bedrock is configured (model id + creds present) and not mocked. */
export function isBedrockEnabled(): boolean {
  if (isBedrockMocked) return false;
  return Boolean(process.env.BEDROCK_MODEL_ID && process.env.ACCESS_KEY);
}
