import { describe, expect, it } from "vitest";
import { buildSourceUsername } from "./sourceUser";

describe("buildSourceUsername", () => {
  it("prefixes the slug", () => {
    expect(
      buildSourceUsername({ name: "Smashing Mag", slug: "smashing" }),
    ).toBe("source-smashing");
  });

  it("falls back to the name when there is no slug", () => {
    expect(buildSourceUsername({ name: "Dev.to Top!", slug: null })).toBe(
      "source-dev-to-top-",
    );
  });

  it("fits the 40-character username column", () => {
    const username = buildSourceUsername({ name: "x", slug: "a".repeat(100) });
    expect(username).toHaveLength(40);
  });
});
