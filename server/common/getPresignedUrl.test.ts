import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Regression guard: a trailing space in S3_BUCKET_NAME (or the keys) once made
// every presigned PUT fail with 400 InvalidBucketName. These values must be
// trimmed before they reach the bucket name / SigV4 credential.
describe("getPresignedUrl whitespace hardening", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getPresignedUrl: any;

  beforeAll(async () => {
    // Whitespace-padded credentials, set before import so the s3 client (built
    // at module load) sees them.
    process.env.ACCESS_KEY = "AKIATESTKEY1234567890 ";
    process.env.SECRET_KEY = "secretsecretsecretsecretsecretsecret1234\n";
    ({ getPresignedUrl } = await import("@/server/common/getPresignedUrl"));
  });

  afterAll(() => {
    delete process.env.ACCESS_KEY;
    delete process.env.SECRET_KEY;
    delete process.env.S3_BUCKET_NAME;
  });

  it("trims a trailing space in S3_BUCKET_NAME so the PUT targets the real bucket", async () => {
    process.env.S3_BUCKET_NAME = "codu.uploads "; // <- the prod footgun
    const url = await getPresignedUrl("image/png", 123, {
      kind: "uploads",
      userId: "u1",
    });
    expect(url).toContain("/codu.uploads/");
    expect(url).not.toContain("codu.uploads%20");
    expect(url).not.toContain("codu.uploads ");
  });

  it("trims whitespace in the access key used to sign the URL", async () => {
    process.env.S3_BUCKET_NAME = "codu.uploads";
    const url = await getPresignedUrl("image/png", 123, {
      kind: "uploads",
      userId: "u1",
    });
    const cred = new URL(url).searchParams.get("X-Amz-Credential") ?? "";
    expect(cred.startsWith("AKIATESTKEY1234567890/")).toBe(true);
    expect(cred).not.toContain("%20");
  });
});
