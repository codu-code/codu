import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { postVisibilityFilter } from "./postVisibility";

const dialect = new PgDialect();

// Statuses and ids are bound as parameters, so the interesting assertions are
// about which values a viewer's filter binds, not the SQL text.
const render = (viewer: Parameters<typeof postVisibilityFilter>[0]) => {
  const { sql, params } = dialect.sqlToQuery(postVisibilityFilter(viewer));
  return {
    sql,
    params,
    scopesToAuthor: sql.includes('"author_id" = '),
    allowsUnpublished:
      params.includes("in_review") && params.includes("rejected"),
  };
};

describe("postVisibilityFilter", () => {
  it("shows an anonymous viewer only live posts", () => {
    const filter = render({});

    expect(filter.params).toContain("published");
    expect(filter.sql).toContain('"published_at" <= ');
    expect(filter.allowsUnpublished).toBe(false);
  });

  it("lets a signed-in viewer see unpublished posts only when they wrote them", () => {
    const filter = render({ viewerId: "viewer-1" });

    expect(filter.allowsUnpublished).toBe(true);
    // The author predicate is what stops one member reading another's drafts.
    expect(filter.scopesToAuthor).toBe(true);
    expect(filter.params).toContain("viewer-1");
  });

  it("lets an admin see unpublished posts by any author", () => {
    const filter = render({ viewerId: "admin-1", viewerIsAdmin: true });

    expect(filter.allowsUnpublished).toBe(true);
    expect(filter.scopesToAuthor).toBe(false);
  });

  it("does not grant the admin bypass on a plain signed-in session", () => {
    const admin = render({ viewerId: "admin-1", viewerIsAdmin: true });
    const member = render({ viewerId: "admin-1" });

    expect(member.sql).not.toEqual(admin.sql);
    expect(member.scopesToAuthor).toBe(true);
  });

  it("never exposes drafts, whoever is looking", () => {
    for (const viewer of [
      {},
      { viewerId: "viewer-1" },
      { viewerId: "admin-1", viewerIsAdmin: true },
    ]) {
      expect(render(viewer).params).not.toContain("draft");
    }
  });
});
