import { describe, it, expect } from "vitest";
import {
  parseAnalysis,
  analyzePost,
  type TopicVocabEntry,
} from "./contentAnalysis";

const VOCAB: TopicVocabEntry[] = [
  { slug: "rag", label: "RAG" },
  { slug: "ai-agents", label: "AI Agents" },
  { slug: "nextjs", label: "Next.js" },
];

const input = { title: "t", body: "b" };

describe("parseAnalysis", () => {
  it("parses a full valid analysis and keeps only vocab topics", () => {
    const a = parseAnalysis(
      JSON.stringify({
        topics: [
          { slug: "rag", confidence: 0.9 },
          { slug: "not-a-real-topic", confidence: 0.8 },
        ],
        proposedTopics: ["llmops"],
        sentiment: "positive",
        sentimentScore: 0.7,
        qualityScore: 0.85,
        qualityReason: "substantial",
        moderation: { verdict: "allow", category: "none", reason: "" },
      }),
      VOCAB,
      input,
    );
    expect(a.topics).toEqual([{ slug: "rag", confidence: 0.9 }]);
    expect(a.proposedTopics).toEqual(["llmops"]);
    expect(a.sentiment).toBe("positive");
    expect(a.qualityScore).toBe(0.85);
    expect(a.moderation.verdict).toBe("allow");
  });

  it("drops a proposed topic that already exists in the vocab", () => {
    const a = parseAnalysis(
      JSON.stringify({ topics: [], proposedTopics: ["rag", "newthing"] }),
      VOCAB,
      input,
    );
    expect(a.proposedTopics).toEqual(["newthing"]);
  });

  it("clamps out-of-range scores", () => {
    const a = parseAnalysis(
      JSON.stringify({ sentimentScore: 5, qualityScore: -2 }),
      VOCAB,
      input,
    );
    expect(a.sentimentScore).toBe(1);
    expect(a.qualityScore).toBe(0);
  });

  it("extracts JSON embedded in surrounding prose", () => {
    const a = parseAnalysis(
      'Here: {"moderation":{"verdict":"review","category":"nsfw","reason":"x"}} ok',
      VOCAB,
      input,
    );
    expect(a.moderation.verdict).toBe("review");
    expect(a.moderation.category).toBe("nsfw");
  });

  it("falls back to the heuristic on unparseable garbage (fail-open allow on clean text)", () => {
    const a = parseAnalysis("not json at all", VOCAB, {
      title: "Shipping my AI side project",
      body: "A clean writeup about what I built and learned.",
    });
    expect(a.topics).toEqual([]);
    expect(a.moderation.verdict).toBe("allow");
  });

  it("treats an unknown moderation verdict as review (fail-safe)", () => {
    const a = parseAnalysis(
      JSON.stringify({ moderation: { verdict: "banana" } }),
      VOCAB,
      input,
    );
    expect(a.moderation.verdict).toBe("review");
  });
});

describe("analyzePost (disabled path)", () => {
  it("returns heuristic-only analysis with no AI signals when Bedrock is disabled", async () => {
    // Under Vitest isBedrockEnabled() is forced false (NODE_ENV==="test").
    delete process.env.BEDROCK_MODEL_ID;
    delete process.env.ACCESS_KEY;

    const a = await analyzePost(
      {
        type: "article",
        title: "Shipping my first AI side project",
        body: "I built a small tool this weekend and shared what I learned.",
      },
      VOCAB,
    );

    expect(a.topics).toEqual([]);
    expect(a.sentiment).toBeNull();
    expect(a.qualityScore).toBeNull();
    expect(a.moderation.verdict).toBe("allow");
  });
});
