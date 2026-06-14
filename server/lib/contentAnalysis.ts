import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import * as Sentry from "@sentry/nextjs";
import { bedrockClient, isBedrockEnabled } from "@/server/lib/bedrock";
import { screenContent } from "@/server/lib/moderation";
import { fetchPageText } from "@/server/lib/fetchPage";

// Bump to force re-analysis of every post (vs post_metadata.schemaVersion).
export const ANALYSIS_SCHEMA_VERSION = 1;

export type Sentiment = "positive" | "neutral" | "negative";

export interface TopicSuggestion {
  /** A slug from the supplied controlled vocabulary. */
  slug: string;
  /** 0..1 model confidence. */
  confidence: number;
}

export interface ContentAnalysis {
  /** Topics resolved against the controlled vocabulary (slugs only). */
  topics: TopicSuggestion[];
  /** New topic slugs the model proposes that weren't in the vocabulary. */
  proposedTopics: string[];
  sentiment: Sentiment | null;
  /** -1..1; negative .. positive. */
  sentimentScore: number | null;
  /** 0..1; higher = higher quality / lower spam risk. */
  qualityScore: number | null;
  qualityReason: string;
  /** Moderation verdict, mirroring autoReview's shape. */
  moderation: { verdict: "allow" | "review"; category: string; reason: string };
}

export interface AnalyzePostInput {
  type?: string | null;
  title?: string | null;
  body?: string | null;
  externalUrl?: string | null;
}

export interface TopicVocabEntry {
  slug: string;
  label: string;
}

const MAX_BODY_CHARS = 6000;
const MAX_TOPICS = 4;

function buildSystemPrompt(vocab: TopicVocabEntry[]): string {
  const list = vocab.map((t) => `${t.slug} (${t.label})`).join(", ");
  return `You analyse posts for Codú, a community for AI builders and indie hackers. Return a single JSON object describing the post. No prose, JSON only.

Do FOUR things:
1. TOPICS: pick up to ${MAX_TOPICS} of the most relevant topics. You MUST choose slugs from this controlled list: [${list}]. Only include a topic if it genuinely fits. If the post is clearly about an important topic that is missing from the list, add its kebab-case slug to "proposedTopics" (do NOT put proposed topics in "topics").
2. SENTIMENT: the overall tone toward its subject — "positive", "neutral" or "negative" — and a sentimentScore from -1 (very negative) to 1 (very positive).
3. QUALITY: a qualityScore from 0 (spam / zero-effort / link-only with no substance) to 1 (substantial, useful, well-formed), with a one-sentence qualityReason.
4. MODERATION: be LOOSE and FAIR — allow by default, including people sharing their OWN projects/launches. Only "review" the clearly bad: pornographic/NSFW, crypto/token shilling, scams/phishing, malicious or fabricated links, or content plainly off-theme for a developer/AI-builder community. When in doubt, allow.

Reply with ONLY this JSON shape:
{"topics":[{"slug":string,"confidence":number}],"proposedTopics":[string],"sentiment":"positive"|"neutral"|"negative","sentimentScore":number,"qualityScore":number,"qualityReason":string,"moderation":{"verdict":"allow"|"review","category":string,"reason":string}}
Use moderation category "none" and reason "" for an allow.`;
}

// Fallback when Bedrock is off: heuristic moderation only, no AI signals.
function heuristicAnalysis(input: AnalyzePostInput): ContentAnalysis {
  const result = screenContent({ title: input.title, body: input.body });
  return {
    topics: [],
    proposedTopics: [],
    sentiment: null,
    sentimentScore: null,
    qualityScore: null,
    qualityReason: "",
    moderation: result.ok
      ? { verdict: "allow", category: "none", reason: "" }
      : {
          verdict: "review",
          category: "heuristic",
          reason: result.reasons.join(", "),
        },
  };
}

// One Bedrock call -> topics + sentiment + quality + moderation. Fail-open: any
// error falls back to the heuristic so a model failure never blocks the pipeline.
export async function analyzePost(
  input: AnalyzePostInput,
  vocab: TopicVocabEntry[],
): Promise<ContentAnalysis> {
  if (!isBedrockEnabled()) {
    return heuristicAnalysis(input);
  }

  try {
    const modelId = process.env.BEDROCK_MODEL_ID as string;
    const { type, title, body, externalUrl } = input;
    const pageText = externalUrl ? await fetchPageText(externalUrl) : "";

    const userMessage = [
      `Type: ${type ?? "post"}`,
      `Title: ${title ?? ""}`,
      `Body: ${(body ?? "").slice(0, MAX_BODY_CHARS)}`,
      externalUrl ? `External URL: ${externalUrl}` : "",
      pageText ? `Linked page text:\n${pageText}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 512,
          system: buildSystemPrompt(vocab),
          messages: [{ role: "user", content: userMessage }],
        }),
      }),
    );

    const decoded = JSON.parse(new TextDecoder().decode(res.body)) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = decoded.content?.[0]?.text ?? "";
    return parseAnalysis(text, vocab, input);
  } catch (err) {
    Sentry.captureException(err);
    // FAIL OPEN: fall back to the heuristic rather than corrupt/skip the row.
    return heuristicAnalysis(input);
  }
}

/** Pull the first {...} object out of text that may be wrapped in prose. */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
}

function clamp(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

// Parse the model's JSON. Unknown topics are dropped; unparseable input falls
// back to the heuristic; an unexpected verdict routes to review.
export function parseAnalysis(
  raw: string,
  vocab: TopicVocabEntry[],
  input: AnalyzePostInput,
): ContentAnalysis {
  let obj: unknown;
  try {
    obj = JSON.parse(extractJson(raw));
  } catch {
    return heuristicAnalysis(input);
  }

  const o = (obj ?? {}) as Record<string, unknown>;
  const vocabSlugs = new Set(vocab.map((t) => t.slug));

  const topics: TopicSuggestion[] = Array.isArray(o.topics)
    ? (o.topics as unknown[])
        .map((t) => {
          const tt = (t ?? {}) as Record<string, unknown>;
          const slug = typeof tt.slug === "string" ? tt.slug : "";
          const confidence = clamp(tt.confidence, 0, 1) ?? 0.5;
          return { slug, confidence };
        })
        .filter((t) => vocabSlugs.has(t.slug))
        .slice(0, MAX_TOPICS)
    : [];

  const proposedTopics: string[] = Array.isArray(o.proposedTopics)
    ? (o.proposedTopics as unknown[])
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .map((s) => s.toLowerCase().trim())
        .filter((s) => !vocabSlugs.has(s))
        .slice(0, MAX_TOPICS)
    : [];

  const sentiment: Sentiment | null =
    o.sentiment === "positive" ||
    o.sentiment === "neutral" ||
    o.sentiment === "negative"
      ? o.sentiment
      : null;

  const mod = (o.moderation ?? {}) as Record<string, unknown>;
  const moderation =
    mod.verdict === "allow"
      ? {
          verdict: "allow" as const,
          category: typeof mod.category === "string" ? mod.category : "none",
          reason: typeof mod.reason === "string" ? mod.reason : "",
        }
      : {
          verdict: "review" as const,
          category: typeof mod.category === "string" ? mod.category : "unknown",
          reason: typeof mod.reason === "string" ? mod.reason : "",
        };

  return {
    topics,
    proposedTopics,
    sentiment,
    sentimentScore: clamp(o.sentimentScore, -1, 1),
    qualityScore: clamp(o.qualityScore, 0, 1),
    qualityReason: typeof o.qualityReason === "string" ? o.qualityReason : "",
    moderation,
  };
}
