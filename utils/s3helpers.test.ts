import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadFile } from "./s3helpers";

// Regression guard: spreading a Response (`{ ...response }`) dropped its
// prototype getters, so `result.ok` came back `undefined` and the editor
// reported failure on every upload — even on a 200.
describe("uploadFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockPutResponse(status: number, url: string) {
    const response = new Response(null, { status });
    // Response.url is read-only via the constructor; pin it for fileLocation.
    Object.defineProperty(response, "url", { value: url });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  }

  const file = new Blob(["x"], { type: "image/png" }) as unknown as File;

  it("exposes ok=true on a successful PUT so callers can detect success", async () => {
    mockPutResponse(
      200,
      "https://bucket.s3.amazonaws.com/uploads/u1/abc.png?sig=x",
    );

    const result = await uploadFile("https://signed-url", file);

    expect(result.ok).toBe(true);
    expect(result.fileLocation).toBe(
      "https://bucket.s3.amazonaws.com/uploads/u1/abc.png",
    );
  });

  it("exposes ok=false when S3 rejects the PUT", async () => {
    mockPutResponse(
      403,
      "https://bucket.s3.amazonaws.com/uploads/u1/abc.png?sig=x",
    );

    const result = await uploadFile("https://signed-url", file);

    expect(result.ok).toBe(false);
  });
});
