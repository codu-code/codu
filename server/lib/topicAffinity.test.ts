import { describe, it, expect } from "vitest";
import { decayedWeight, HALF_LIFE_DAYS } from "./topicAffinity";

describe("decayedWeight", () => {
  it("returns the base weight for a fresh interaction", () => {
    expect(decayedWeight(4, 0)).toBe(4);
    expect(decayedWeight(4, -1)).toBe(4);
  });

  it("halves the weight after one half-life", () => {
    expect(decayedWeight(4, HALF_LIFE_DAYS)).toBeCloseTo(2);
  });

  it("quarters the weight after two half-lives", () => {
    expect(decayedWeight(4, HALF_LIFE_DAYS * 2)).toBeCloseTo(1);
  });

  it("decays negative weights toward zero too", () => {
    expect(decayedWeight(-1, HALF_LIFE_DAYS)).toBeCloseTo(-0.5);
  });
});
