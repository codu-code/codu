import { describe, it, expect } from "vitest";
import { parseVerdict, autoReview } from "./autoReview";

describe("parseVerdict", () => {
  it("parses an allow verdict", () => {
    expect(
      parseVerdict('{"verdict":"allow","category":"none","reason":""}'),
    ).toEqual({ verdict: "allow", category: "none", reason: "" });
  });
  it("parses a review verdict with reason", () => {
    const v = parseVerdict(
      '{"verdict":"review","category":"crypto","reason":"token shill"}',
    );
    expect(v.verdict).toBe("review");
    expect(v.category).toBe("crypto");
  });
  it("extracts JSON embedded in surrounding prose", () => {
    expect(
      parseVerdict(
        'Sure! {"verdict":"review","category":"nsfw","reason":"x"} done',
      ).verdict,
    ).toBe("review");
  });
  it("defaults to allow (fail-open) on unparseable garbage", () => {
    expect(parseVerdict("not json").verdict).toBe("allow");
  });
  it("treats a successfully-parsed but unknown verdict as review (fail-safe)", () => {
    expect(parseVerdict('{"verdict":"banana"}').verdict).toBe("review");
  });
});

describe("autoReview (disabled path)", () => {
  it("returns allow via the heuristic fallback when Bedrock is disabled and content is clean", async () => {
    // Under Vitest NODE_ENV==="test" so isBedrockMocked is true and
    // isBedrockEnabled() is forced false; we also clear the env vars to make
    // the disabled state explicit. This exercises the screenContent fallback
    // with NO network/model call.
    delete process.env.BEDROCK_MODEL_ID;
    delete process.env.ACCESS_KEY;

    const v = await autoReview({
      type: "article",
      title: "Shipping my first AI side project",
      body: "I built a small tool this weekend and wanted to share how it went and what I learned along the way.",
    });

    expect(v.verdict).toBe("allow");
  });
});
