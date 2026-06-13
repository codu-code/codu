import { describe, it, expect } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

describe("normalizeUrl", () => {
  it("lowercases host, strips www and trailing slash", () => {
    expect(normalizeUrl("https://WWW.Example.com/Path/")).toBe(
      "https://example.com/Path",
    );
  });
  it("drops tracking params but keeps meaningful ones", () => {
    expect(normalizeUrl("https://x.com/a?utm_source=t&id=5&fbclid=z")).toBe(
      "https://x.com/a?id=5",
    );
  });
  it("drops the fragment", () => {
    expect(normalizeUrl("https://x.com/a#section")).toBe("https://x.com/a");
  });
  it("returns null for non-http input", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
  it("treats bare host with/without www as equal", () => {
    expect(normalizeUrl("http://example.com")).toBe(
      normalizeUrl("http://www.example.com"),
    );
  });
});
