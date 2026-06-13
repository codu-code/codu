import { describe, it, expect } from "vitest";
import { getArticleSchema } from "./article";

const baseArticle = {
  title: "Building agents with Bedrock",
  excerpt: "A practical guide.",
  slug: "building-agents-bedrock",
  publishedAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-10T12:00:00.000Z",
  readingTime: 6,
  canonicalUrl: null,
  tags: [{ title: "AI" }, { title: "AWS" }],
  author: {
    name: "Niall Maher",
    username: "niall-maher-p13",
    image: "https://example.com/niall.png",
    bio: "Founder",
  },
};

describe("getArticleSchema", () => {
  it("defaults to BlogPosting with @context", () => {
    const schema = getArticleSchema(baseArticle);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe(baseArticle.title);
  });

  it("emits honest datePublished and dateModified from the post timestamps", () => {
    const schema = getArticleSchema(baseArticle);
    expect(schema.datePublished).toBe("2026-05-01T10:00:00.000Z");
    expect(schema.dateModified).toBe("2026-05-10T12:00:00.000Z");
  });

  it("emits an image", () => {
    const schema = getArticleSchema(baseArticle);
    expect(schema.image).toContain("/og?");
  });

  it("emits an author with a profile url", () => {
    const schema = getArticleSchema(baseArticle);
    expect(schema.author).toMatchObject({
      "@type": "Person",
      name: "Niall Maher",
      url: "https://www.codu.co/niall-maher-p13",
    });
  });

  it("uses canonicalUrl for mainEntityOfPage when set (member link-posts)", () => {
    const schema = getArticleSchema({
      ...baseArticle,
      canonicalUrl:
        "https://www.codu.co/niall-maher-p13/building-agents-bedrock",
    });
    expect(schema.mainEntityOfPage).toBe(
      "https://www.codu.co/niall-maher-p13/building-agents-bedrock",
    );
  });

  it("respects an explicit Article schemaType", () => {
    const schema = getArticleSchema(baseArticle, { schemaType: "Article" });
    expect(schema["@type"]).toBe("Article");
  });
});
