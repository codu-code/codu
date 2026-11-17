import { describe, it, expect } from "vitest";
import {
  buildPostValues,
  extractExcerpt,
  extractImageUrl,
  generateSlug,
  isIngestable,
  parseArticleMetadata,
  type FeedItem,
} from "./rssIngest";

const now = new Date("2026-06-09T12:00:00.000Z");

const item = (overrides: FeedItem = {}): FeedItem => ({
  title: "Why RAG Beats Fine-Tuning",
  link: "https://example.com/rag",
  pubDate: "Mon, 08 Jun 2026 09:00:00 GMT",
  ...overrides,
});

describe("extractExcerpt", () => {
  it("strips tags and collapses whitespace", () => {
    expect(extractExcerpt("<p>Hello\n\n  <b>world</b></p>")).toBe(
      "Hello world",
    );
  });

  it("truncates to 300 characters with an ellipsis", () => {
    expect(extractExcerpt("a".repeat(301))).toBe("a".repeat(300) + "...");
  });

  it("returns an empty string for missing content", () => {
    expect(extractExcerpt(undefined)).toBe("");
  });
});

describe("generateSlug", () => {
  it("slugifies the title and appends the short id", () => {
    expect(generateSlug("Why RAG Beats Fine-Tuning!", "Ab3dE9z")).toBe(
      "why-rag-beats-fine-tuning-Ab3dE9z",
    );
  });

  it("keeps the slug within the 300 character column", () => {
    expect(generateSlug("a".repeat(400), "Ab3dE9z")).toHaveLength(288);
  });
});

describe("extractImageUrl", () => {
  const mediaContent = { $: { url: "https://cdn.example.com/content.png" } };
  const mediaThumbnail = { $: { url: "https://cdn.example.com/thumb.png" } };
  const enclosure = {
    url: "https://cdn.example.com/enclosure.png",
    type: "image/png",
  };

  it("prefers media:content, then media:thumbnail, then an image enclosure", () => {
    expect(extractImageUrl({ mediaContent, mediaThumbnail, enclosure })).toBe(
      mediaContent.$.url,
    );
    expect(extractImageUrl({ mediaThumbnail, enclosure })).toBe(
      mediaThumbnail.$.url,
    );
    expect(extractImageUrl({ enclosure })).toBe(enclosure.url);
  });

  it("ignores non-image enclosures", () => {
    expect(
      extractImageUrl({
        enclosure: { url: "https://example.com/ep.mp3", type: "audio/mpeg" },
      }),
    ).toBeNull();
  });
});

describe("isIngestable", () => {
  const none = new Set<string>();

  it("accepts a recent, unseen item", () => {
    expect(isIngestable(item(), none, now)).toBe(true);
  });

  it("skips items missing a link, title or publish date", () => {
    expect(isIngestable(item({ link: undefined }), none, now)).toBe(false);
    expect(isIngestable(item({ title: undefined }), none, now)).toBe(false);
    expect(isIngestable(item({ pubDate: undefined }), none, now)).toBe(false);
  });

  it("skips items with an unparseable publish date", () => {
    expect(isIngestable(item({ pubDate: "not a date" }), none, now)).toBe(
      false,
    );
  });

  it("skips items older than 30 days", () => {
    const pubDate = new Date("2026-05-09T11:59:59.000Z").toUTCString();
    expect(isIngestable(item({ pubDate }), none, now)).toBe(false);
  });

  it("skips items whose link is already stored for the source", () => {
    expect(
      isIngestable(item(), new Set(["https://example.com/rag"]), now),
    ).toBe(false);
  });
});

describe("parseArticleMetadata", () => {
  it("reads og:image in either attribute order", () => {
    expect(
      parseArticleMetadata(
        '<meta property="og:image" content="https://example.com/og.png">',
      ).ogImage,
    ).toBe("https://example.com/og.png");
    expect(
      parseArticleMetadata(
        '<meta content="https://example.com/og.png" property="og:image">',
      ).ogImage,
    ).toBe("https://example.com/og.png");
  });

  it("falls back to twitter:image only when there is no og:image", () => {
    const twitter =
      '<meta name="twitter:image" content="https://example.com/tw.png">';
    expect(parseArticleMetadata(twitter).ogImage).toBe(
      "https://example.com/tw.png",
    );
    expect(
      parseArticleMetadata(
        `${twitter}<meta property="og:image" content="https://example.com/og.png">`,
      ).ogImage,
    ).toBe("https://example.com/og.png");
  });

  it("estimates read time from visible words, clamped to 1-30 minutes", () => {
    expect(
      parseArticleMetadata("<script>ignored words</script><p>hi</p>"),
    ).toEqual({ ogImage: null, readTimeMins: 1 });
    expect(parseArticleMetadata("word ".repeat(450)).readTimeMins).toBe(2);
    expect(parseArticleMetadata("word ".repeat(20000)).readTimeMins).toBe(30);
  });
});

describe("buildPostValues", () => {
  const source = { id: 7, userId: "user-1" };
  const metadata = {
    ogImage: "https://example.com/og.png",
    readTimeMins: 4,
  };
  const build = (overrides: FeedItem = {}) => {
    const feedItem = item(overrides);
    if (!isIngestable(feedItem, new Set(), now)) {
      throw new Error("fixture must be ingestable");
    }
    return buildPostValues(feedItem, source, "Ab3dE9z", metadata);
  };

  it("maps a feed item to a published link post owned by the source", () => {
    expect(
      build({ contentSnippet: "A short summary.", creator: "Ada Lovelace" }),
    ).toEqual({
      type: "link",
      title: "Why RAG Beats Fine-Tuning",
      slug: "why-rag-beats-fine-tuning-Ab3dE9z",
      excerpt: "A short summary.",
      externalUrl: "https://example.com/rag",
      coverImage: "https://example.com/og.png",
      sourceId: 7,
      sourceAuthor: "Ada Lovelace",
      readingTime: 4,
      status: "published",
      publishedAt: "2026-06-08T09:00:00.000Z",
      authorId: "user-1",
    });
  });

  it("prefers the feed's image over the page's OG image", () => {
    expect(
      build({ mediaThumbnail: { $: { url: "https://cdn.example.com/t.png" } } })
        .coverImage,
    ).toBe("https://cdn.example.com/t.png");
  });

  it("unwraps a doubled image URL and upgrades it to https", () => {
    expect(
      build({
        mediaThumbnail: {
          $: { url: "https://example.com/http://cdn.example.com/t.png" },
        },
      }).coverImage,
    ).toBe("https://cdn.example.com/t.png");
  });

  it("stores null for a missing excerpt and author", () => {
    expect(build()).toMatchObject({ excerpt: null, sourceAuthor: null });
  });

  it("falls back to the author field and truncates to the column widths", () => {
    const post = build({
      title: "t".repeat(600),
      author: "a".repeat(250),
    });
    expect(post.title).toHaveLength(500);
    expect(post.sourceAuthor).toHaveLength(200);
  });
});
