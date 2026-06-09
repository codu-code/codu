import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { gatePublish } from "./moderation";

// gatePublish is intentionally DB-free: it only imports autoReview (no db) and
// normalizeUrl, so it can be exercised here without booting the env/db layer.
// Under Vitest NODE_ENV==="test", isBedrockMocked is true -> isBedrockEnabled()
// is forced false -> autoReview falls back to the synchronous screenContent
// heuristic with NO network/model call. We flip MODERATION_ENABLED per-case.

const CLEAN_BODY =
  "I built a small tool this weekend and wanted to share how it went and what I learned along the way.";

describe("gatePublish", () => {
  const prev = process.env.MODERATION_ENABLED;

  beforeEach(() => {
    // Keep Bedrock disabled in tests so autoReview uses the heuristic.
    delete process.env.BEDROCK_MODEL_ID;
    delete process.env.ACCESS_KEY;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.MODERATION_ENABLED;
    else process.env.MODERATION_ENABLED = prev;
  });

  it("publishes immediately when moderation is disabled", async () => {
    process.env.MODERATION_ENABLED = "false";
    const r = await gatePublish({
      type: "link",
      title: "A neat tool",
      externalUrl: "https://example.com/page?utm_source=x",
    });
    expect(r.status).toBe("published");
    expect(r.publishedAt).not.toBeNull();
    expect(r.moderationNote).toBeNull();
    // Normalized even when moderation is off (tracking param stripped).
    expect(r.externalUrlNormalized).toBe("https://example.com/page");
  });

  it("routes articles to in_review with an advisory note", async () => {
    process.env.MODERATION_ENABLED = "true";
    // Short body -> heuristic flags "too-short" -> review note recorded.
    const r = await gatePublish({
      type: "article",
      title: "Hi",
      body: "short",
    });
    expect(r.status).toBe("in_review");
    expect(r.publishedAt).toBeNull();
    expect(r.moderationNote).toContain("heuristic");
  });

  it("routes a link to in_review when auto-review returns review", async () => {
    process.env.MODERATION_ENABLED = "true";
    // "free crypto" is a banned phrase -> heuristic -> review verdict.
    const r = await gatePublish({
      type: "link",
      title: "Get free crypto now",
      body: "free crypto airdrop, claim your tokens here right away today",
      externalUrl: "https://spam.example.com/free",
    });
    expect(r.status).toBe("in_review");
    expect(r.publishedAt).toBeNull();
    expect(r.moderationNote).not.toBeNull();
    expect(r.externalUrlNormalized).toBe("https://spam.example.com/free");
  });

  it("publishes a clean link when auto-review allows", async () => {
    process.env.MODERATION_ENABLED = "true";
    const r = await gatePublish({
      type: "link",
      title: "A genuinely useful resource",
      body: CLEAN_BODY,
      externalUrl: "https://good.example.com/post",
    });
    expect(r.status).toBe("published");
    expect(r.publishedAt).not.toBeNull();
    expect(r.moderationNote).toBeNull();
  });

  it("forces in_review when forceInReview is set (similar existing)", async () => {
    process.env.MODERATION_ENABLED = "true";
    const r = await gatePublish({
      type: "discussion",
      title: "How do you structure your AI agents?",
      body: CLEAN_BODY,
      forceInReview: true,
    });
    expect(r.status).toBe("in_review");
    expect(r.publishedAt).toBeNull();
    expect(r.moderationNote).toBe("similar-existing");
  });
});
