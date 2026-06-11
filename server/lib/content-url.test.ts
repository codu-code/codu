import { describe, it, expect } from "vitest";
import {
  parseUrlId,
  buildMemberPath,
  buildDiscussionPath,
  buildSourcePath,
  buildCommentHref,
  canonicalMismatch,
} from "./content-url";

describe("parseUrlId", () => {
  it("returns the last hyphen-delimited token", () => {
    expect(parseUrlId("why-rag-beats-finetuning-a1b2c3d4")).toBe("a1b2c3d4");
  });

  it("returns the input when there is no hyphen", () => {
    expect(parseUrlId("a1b2c3d4")).toBe("a1b2c3d4");
  });
});

describe("buildMemberPath", () => {
  it("builds /username/slug-urlId", () => {
    expect(buildMemberPath("niall-maher", "why-rag-x", "a1b2c3d4")).toBe(
      "/niall-maher/why-rag-x-a1b2c3d4",
    );
  });
});

describe("buildDiscussionPath", () => {
  it("builds /d/slug-urlId", () => {
    expect(buildDiscussionPath("how-do-you-test", "7x8y9z01")).toBe(
      "/d/how-do-you-test-7x8y9z01",
    );
  });
});

describe("buildSourcePath", () => {
  it("builds /s/source/slug-urlId", () => {
    expect(buildSourcePath("vercel-blog", "some-article", "kk22dd00")).toBe(
      "/s/vercel-blog/some-article-kk22dd00",
    );
  });
});

describe("buildCommentHref", () => {
  it("links discussions to /d/{slug}#comment-{id}", () => {
    expect(
      buildCommentHref({
        commentId: "c1",
        parentType: "discussion",
        parentSlug: "how-do-you-test-7x8y9z01",
      }),
    ).toBe("/d/how-do-you-test-7x8y9z01#comment-c1");
  });

  it("links questions to /d/{slug}#comment-{id}", () => {
    expect(
      buildCommentHref({
        commentId: "c2",
        parentType: "question",
        parentSlug: "best-orm-aa11bb22",
      }),
    ).toBe("/d/best-orm-aa11bb22#comment-c2");
  });

  it("links aggregated content to /s/{sourceSlug}/{slug}#comment-{id}", () => {
    expect(
      buildCommentHref({
        commentId: "c3",
        parentType: "article",
        parentSlug: "some-article-kk22dd00",
        sourceSlug: "vercel-blog",
        authorUsername: "feed-bot",
      }),
    ).toBe("/s/vercel-blog/some-article-kk22dd00#comment-c3");
  });

  it("links member content to /{authorUsername}/{slug}#comment-{id}", () => {
    expect(
      buildCommentHref({
        commentId: "c4",
        parentType: "article",
        parentSlug: "why-rag-a1b2c3d4",
        sourceSlug: null,
        authorUsername: "niall-maher",
      }),
    ).toBe("/niall-maher/why-rag-a1b2c3d4#comment-c4");
  });
});

describe("canonicalMismatch", () => {
  it("is true when paths differ", () => {
    expect(
      canonicalMismatch("/niall/old-a1b2c3d4", "/niall-maher/new-a1b2c3d4"),
    ).toBe(true);
  });

  it("is false when paths match", () => {
    expect(canonicalMismatch("/d/x-7x8y9z01", "/d/x-7x8y9z01")).toBe(false);
  });

  it("ignores the querystring when comparing", () => {
    expect(canonicalMismatch("/d/x-7x8y9z01?ref=feed", "/d/x-7x8y9z01")).toBe(
      false,
    );
  });
});
