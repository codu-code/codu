import { describe, it, expect } from "vitest";
import { deriveUrlIdFromSlug } from "./backfill-url-id";

describe("deriveUrlIdFromSlug", () => {
  it("returns the trailing hex segment", () => {
    expect(deriveUrlIdFromSlug("why-rag-a1b2c3")).toBe("a1b2c3");
  });

  it("returns null when there is no hex suffix", () => {
    expect(deriveUrlIdFromSlug("my-post")).toBeNull();
  });

  it("returns null when the trailing segment is too short to be a hex id", () => {
    // "123" is only 3 chars; our suffixes are >= 4 hex chars.
    expect(deriveUrlIdFromSlug("title-with-numbers-123")).toBeNull();
  });

  it("captures a full-word hex segment", () => {
    expect(deriveUrlIdFromSlug("x-deadbeef")).toBe("deadbeef");
  });
});
