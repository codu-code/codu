import { describe, it, expect, afterEach } from "vitest";
import { getAppOrigin } from "./url";

const save = { ...process.env };
afterEach(() => {
  process.env = { ...save };
});

describe("getAppOrigin", () => {
  it("strips a path like /api/auth from NEXTAUTH_URL", () => {
    delete process.env.DOMAIN_NAME;
    delete process.env.VERCEL_URL;
    process.env.NEXTAUTH_URL = "http://localhost:3000/api/auth";
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
  it("prefers DOMAIN_NAME as https origin", () => {
    process.env.DOMAIN_NAME = "www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });
  it("handles DOMAIN_NAME that already includes scheme", () => {
    process.env.DOMAIN_NAME = "https://www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });
  it("falls back to localhost", () => {
    delete process.env.DOMAIN_NAME;
    delete process.env.VERCEL_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.AUTH_URL;
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });
});
