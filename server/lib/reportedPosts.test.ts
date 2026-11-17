import { describe, expect, it } from "vitest";
import {
  groupReportedPosts,
  toLegacyReason,
  type PostReportRow,
} from "./reportedPosts";

const row = (overrides: Partial<PostReportRow>): PostReportRow => ({
  reportId: 1,
  reason: "SPAM",
  details: null,
  reportCreatedAt: "2026-01-01 10:00:00+00",
  postId: "post-a",
  title: "Post A",
  slug: "post-a-abc123",
  authorId: "user-1",
  authorUsername: "ada",
  authorName: "Ada",
  ...overrides,
});

describe("toLegacyReason", () => {
  it("maps a reports.reason value onto the legacy enum form", () => {
    expect(toLegacyReason("off_topic")).toBe("OFF_TOPIC");
    expect(toLegacyReason("SPAM")).toBe("SPAM");
  });
});

describe("groupReportedPosts", () => {
  it("returns nothing when neither table has open reports", () => {
    expect(groupReportedPosts([], [])).toEqual([]);
  });

  it("surfaces a post that only has a system report", () => {
    const [post] = groupReportedPosts(
      [],
      [row({ reportId: 7, reason: "nsfw", details: "Auto-flagged" })],
    );

    expect(post).toMatchObject({
      id: "post-a",
      title: "Post A",
      authorUsername: "ada",
      reportCount: 1,
      reportIds: [],
      systemReportIds: [7],
      latestReason: "NSFW",
      latestDetails: "Auto-flagged",
    });
  });

  it("keeps colliding ids from the two tables in separate fields", () => {
    const [post] = groupReportedPosts(
      [row({ reportId: 5 })],
      [row({ reportId: 5, reason: "spam" })],
    );

    expect(post.reportCount).toBe(2);
    expect(post.reportIds).toEqual([5]);
    expect(post.systemReportIds).toEqual([5]);
  });

  it("takes the headline from the newest report across both tables", () => {
    const [post] = groupReportedPosts(
      [
        row({
          reportId: 1,
          reason: "HARASSMENT",
          details: "member report",
          reportCreatedAt: "2026-01-01 10:00:00+00",
        }),
      ],
      [
        row({
          reportId: 2,
          reason: "off_topic",
          details: "system report",
          reportCreatedAt: "2026-01-02 09:00:00.5+00",
        }),
      ],
    );

    expect(post.latestReason).toBe("OFF_TOPIC");
    expect(post.latestDetails).toBe("system report");
    expect(post.latestReportAt).toBe("2026-01-02 09:00:00.5+00");
  });

  it("orders posts by their most recent report", () => {
    const posts = groupReportedPosts(
      [
        row({
          reportId: 1,
          postId: "post-a",
          reportCreatedAt: "2026-01-03 10:00:00+00",
        }),
        row({
          reportId: 2,
          postId: "post-b",
          reportCreatedAt: "2026-01-01 10:00:00+00",
        }),
      ],
      [
        row({
          reportId: 1,
          postId: "post-c",
          reason: "spam",
          reportCreatedAt: "2026-01-02 10:00:00+00",
        }),
      ],
    );

    expect(posts.map((post) => post.id)).toEqual([
      "post-a",
      "post-c",
      "post-b",
    ]);
  });
});
