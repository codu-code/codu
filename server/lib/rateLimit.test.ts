import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetRateLimits, enforceRateLimit } from "./rateLimit";

const limit = { key: "test:user", limit: 2, windowMs: 60_000 };

describe("enforceRateLimit", () => {
  beforeEach(() => {
    vi.stubEnv("RATE_LIMIT_TABLE", "");
    __resetRateLimits();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws once the limit is exceeded within the window", async () => {
    await enforceRateLimit(limit);
    await enforceRateLimit(limit);

    await expect(
      enforceRateLimit({ ...limit, message: "Slow down" }),
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: "Slow down",
    });
  });

  it("keeps separate buckets per key", async () => {
    await enforceRateLimit(limit);
    await enforceRateLimit(limit);

    await expect(
      enforceRateLimit({ ...limit, key: "test:other-user" }),
    ).resolves.toBeUndefined();
  });

  it("never throttles when RATE_LIMIT_DISABLED is set", async () => {
    vi.stubEnv("RATE_LIMIT_DISABLED", "true");

    for (let i = 0; i < 5; i++) {
      await expect(enforceRateLimit(limit)).resolves.toBeUndefined();
    }
  });
});
