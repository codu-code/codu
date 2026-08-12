import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  moderationPreviewFilter,
  postVisibilityFilter,
  NON_DRAFT_STATUSES,
} from "./postVisibility";

const dialect = new PgDialect();

// Statuses and ids bind as parameters, so the interesting assertions are about
// which values a viewer's filter binds, not the SQL text.
const render = (filter: ReturnType<typeof postVisibilityFilter>) => {
  const { sql, params } = dialect.sqlToQuery(filter);
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
    const filter = render(postVisibilityFilter({}));

    expect(filter.params).toContain("published");
    expect(filter.sql).toContain('"published_at" <= ');
    expect(filter.allowsUnpublished).toBe(false);
  });

  it("lets a signed-in viewer see unpublished posts only when they wrote them", () => {
    const filter = render(postVisibilityFilter({ viewerId: "viewer-1" }));

    expect(filter.allowsUnpublished).toBe(true);
    // The author predicate is what stops one member reading another's drafts.
    expect(filter.scopesToAuthor).toBe(true);
    expect(filter.params).toContain("viewer-1");
  });

  // Admins read submissions through the moderation preview, not by resolving
  // them on the public routes — so being an admin buys nothing here.
  it("has no admin bypass: the rule depends only on who wrote the post", () => {
    const anonymous = render(postVisibilityFilter({}));
    const member = render(postVisibilityFilter({ viewerId: "admin-1" }));

    expect(member.scopesToAuthor).toBe(true);
    expect(member.sql).not.toEqual(anonymous.sql);
  });

  it("never exposes drafts, whoever is looking", () => {
    for (const viewer of [{}, { viewerId: "viewer-1" }]) {
      expect(render(postVisibilityFilter(viewer)).params).not.toContain(
        "draft",
      );
    }
  });
});

describe("moderationPreviewFilter", () => {
  it("covers everything that has been submitted", () => {
    const { params } = dialect.sqlToQuery(moderationPreviewFilter());

    expect(params).toContain("in_review");
    expect(params).toContain("rejected");
    expect(params).toContain("published");
  });

  it("never exposes a private draft to a moderator", () => {
    const { params } = dialect.sqlToQuery(moderationPreviewFilter());

    expect(params).not.toContain("draft");
    expect(NON_DRAFT_STATUSES).not.toContain("draft");
  });
});
