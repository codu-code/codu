import { describe, it, expect } from "vitest";
import { isReservedUsername } from "./reserved-usernames";

describe("isReservedUsername", () => {
  it("reserves live route names", () => {
    expect(isReservedUsername("settings")).toBe(true);
    expect(isReservedUsername("articles")).toBe(true);
  });

  it("reserves single-letter route names", () => {
    expect(isReservedUsername("d")).toBe(true);
    expect(isReservedUsername("x")).toBe(true);
  });

  it("reserves impersonation/safety names", () => {
    expect(isReservedUsername("codu")).toBe(true);
    expect(isReservedUsername("admin")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isReservedUsername("Settings")).toBe(true);
  });

  it("trims whitespace", () => {
    expect(isReservedUsername("  admin  ")).toBe(true);
  });

  it("allows a normal handle", () => {
    expect(isReservedUsername("niall-maher")).toBe(false);
  });
});
