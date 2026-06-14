import { describe, it, expect, beforeAll } from "vitest";

// Regression guard for the tableNamesMap collision: the schema barrel re-exports
// a few tables under camelCase aliases (postVotes/postTags/...), and feeding both
// keys to drizzle dropped the join tables' relations — which broke `with: { tags }`
// / `with: { votes }` on /feed.xml ("not enough information to infer relation
// posts.tags"). server/db/index.ts strips the aliases before handing the schema
// to drizzle; these tests fail if that regresses.
describe("posts relational config", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any;

  beforeAll(async () => {
    process.env.SKIP_ENV_VALIDATION = "1";
    process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/test";
    // Dynamic import so the env stubs above land before the module reads them.
    ({ db } = await import("@/server/db"));
  });

  it("registers relations on all four aliased join tables (no collision)", () => {
    const schema = db._.schema;
    // All four tables that have a camelCase alias re-export must keep their
    // relations registered under the canonical snake_case key.
    expect(Object.keys(schema.post_tags.relations)).toEqual(
      expect.arrayContaining(["post", "tag"]),
    );
    expect(Object.keys(schema.post_votes.relations)).toContain("post");
    expect(Object.keys(schema.comment_votes.relations)).toContain("comment");
    expect(Object.keys(schema.feed_sources.relations)).toContain("user");
  });

  it("builds relational queries that walk the previously-broken relations", () => {
    expect(() =>
      db.query.posts
        .findMany({
          columns: { title: true },
          with: {
            author: { columns: { username: true } }, // used by /feed.xml
            tags: { with: { tag: true } }, // post_tags
            votes: true, // post_votes
            source: true, // feed_sources (one)
          },
          limit: 1,
        })
        .toSQL(),
    ).not.toThrow();
  });
});
