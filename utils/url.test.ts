import { describe, it, expect } from "vitest";
import { unwrapDoubledUrl, ensureHttps } from "./url";

describe("unwrapDoubledUrl", () => {
  it("unwraps a URL prefixed with another origin (HackerNoon media:thumbnail bug)", () => {
    expect(
      unwrapDoubledUrl(
        "https://hackernoon.com/https://cdn.hackernoon.com/images/A7coZ0.png",
      ),
    ).toBe("https://cdn.hackernoon.com/images/A7coZ0.png");
  });

  it("unwraps an http-wrapped https URL, keeping the inner scheme", () => {
    expect(
      unwrapDoubledUrl("http://example.com/https://cdn.example.com/x.png"),
    ).toBe("https://cdn.example.com/x.png");
  });

  it("leaves a normal absolute URL untouched", () => {
    expect(unwrapDoubledUrl("https://cdn.thenewstack.io/media/x.png")).toBe(
      "https://cdn.thenewstack.io/media/x.png",
    );
  });

  it("does not treat a scheme in the query string as a wrapper", () => {
    // Only one real scheme at index 0 — a `?url=https://...` proxy param is left alone.
    expect(
      unwrapDoubledUrl("https://img.proxy/optimize?url=https://cdn.site/x.png"),
    ).toBe("https://img.proxy/optimize?url=https://cdn.site/x.png");
  });

  it("leaves a scheme that appears deeper in the path untouched", () => {
    // A slug or nested path segment that contains `http://` is NOT a doubled
    // origin — only a scheme immediately after the host counts.
    const slug = "https://blog.com/2021/http-vs-https/cover.png";
    expect(unwrapDoubledUrl(slug)).toBe(slug);
    const nested = "https://cdn.site.com/a/https://b/x.png";
    expect(unwrapDoubledUrl(nested)).toBe(nested);
  });

  it("passes through null/empty", () => {
    expect(unwrapDoubledUrl(null)).toBeNull();
    expect(unwrapDoubledUrl(undefined)).toBeNull();
    expect(unwrapDoubledUrl("")).toBeNull();
  });

  it("composes with ensureHttps to clean a wrapped http CDN url", () => {
    expect(
      ensureHttps(
        unwrapDoubledUrl(
          "https://hackernoon.com/http://cdn.hackernoon.com/x.png",
        ),
      ),
    ).toBe("https://cdn.hackernoon.com/x.png");
  });
});
