import { describe, it, expect, afterEach } from "vitest";
import { getAppOrigin } from "./url";
import { SITE_ORIGIN } from "@/config/site";

const save = { ...process.env };
afterEach(() => {
  process.env = { ...save };
});

const clearEnv = () => {
  delete process.env.DOMAIN_NAME;
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.NEXTAUTH_URL;
  delete process.env.AUTH_URL;
};

describe("getAppOrigin", () => {
  it("strips a path like /api/auth from NEXTAUTH_URL", () => {
    clearEnv();
    process.env.NEXTAUTH_URL = "http://localhost:3000/api/auth";
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  it("prefers DOMAIN_NAME as https origin", () => {
    clearEnv();
    process.env.DOMAIN_NAME = "www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });

  it("handles DOMAIN_NAME that already includes scheme", () => {
    clearEnv();
    process.env.DOMAIN_NAME = "https://www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });

  it("falls back to localhost", () => {
    clearEnv();
    expect(getAppOrigin()).toBe("http://localhost:3000");
  });

  // The bug: VERCEL_URL is the per-deployment hostname and Vercel sets it in
  // production too, so emails went out pointing at *.vercel.app.
  it("never uses the per-deployment URL on a production deploy", () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "codu-a1b2c3.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.codu.co";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });

  // Nothing configured at all: the deployment URL is a poor origin to email,
  // but it beats sending a fork's users to somebody else's domain.
  it("falls back to the deployment URL before the canonical origin", () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "codu-a1b2c3.vercel.app";
    expect(getAppOrigin()).toBe("https://codu-a1b2c3.vercel.app");
  });

  it("falls back to the canonical origin when there is nothing else", () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    expect(getAppOrigin()).toBe(SITE_ORIGIN);
  });

  // A fork deploying to production without VERCEL_PROJECT_PRODUCTION_URL must
  // not have its verification links point at codu.co.
  it("prefers a configured auth origin over the canonical one in production", () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "fork-a1b2c3.vercel.app";
    process.env.NEXTAUTH_URL = "https://myfork.example/api/auth";
    expect(getAppOrigin()).toBe("https://myfork.example");
  });

  it("still uses the deployment URL on a preview deploy", () => {
    clearEnv();
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "codu-a1b2c3.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.codu.co";
    expect(getAppOrigin()).toBe("https://codu-a1b2c3.vercel.app");
  });

  it("lets DOMAIN_NAME override even in production", () => {
    clearEnv();
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "www.codu.co";
    process.env.DOMAIN_NAME = "staging.codu.co";
    expect(getAppOrigin()).toBe("https://staging.codu.co");
  });

  it("tolerates a trailing slash", () => {
    clearEnv();
    process.env.DOMAIN_NAME = "https://www.codu.co/";
    expect(getAppOrigin()).toBe("https://www.codu.co");
  });
});
