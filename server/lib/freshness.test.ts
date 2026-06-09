import { describe, it, expect } from "vitest";
import { isWithinFreshnessWindow, FRESHNESS_MONTHS } from "./freshness";

describe("isWithinFreshnessWindow", () => {
  const now = new Date("2026-06-09T12:00:00.000Z");

  it("returns true for a post published just now", () => {
    expect(isWithinFreshnessWindow(now, now)).toBe(true);
  });

  it("returns true for a post published within the window", () => {
    const recent = new Date("2026-03-01T00:00:00.000Z"); // ~3 months ago
    expect(isWithinFreshnessWindow(recent, now)).toBe(true);
  });

  it("returns false for a post published before the window", () => {
    const old = new Date("2025-06-09T11:00:00.000Z"); // 12 months ago
    expect(isWithinFreshnessWindow(old, now)).toBe(false);
  });

  it("treats a post published exactly FRESHNESS_MONTHS ago as IN the window (inclusive boundary)", () => {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS); // exactly 6 months before now
    expect(isWithinFreshnessWindow(cutoff, now)).toBe(true);
  });

  it("treats one millisecond before the cutoff as OUT of the window", () => {
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - FRESHNESS_MONTHS);
    const justOutside = new Date(cutoff.getTime() - 1);
    expect(isWithinFreshnessWindow(justOutside, now)).toBe(false);
  });
});
