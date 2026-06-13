export const articleContent =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas vitae ipsum id metus vestibulum rutrum eget a diam. Integer eget vulputate risus, ac convallis nulla. Mauris sed augue nunc. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam congue posuere tempor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut ac augue non libero ullamcorper ornare. Ut commodo ligula vitae malesuada maximus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Etiam sagittis justo non justo placerat, a dapibus sapien volutpat. Nullam ullamcorper sodales justo sed.";

export const articleExcerpt = "This is an excerpt for a published article.";

export const E2E_USER_ONE_EMAIL = "e2e@codu.co";
export const E2E_USER_ONE_ID = "8e3179ce-f32b-4d0a-ba3b-234d66b836ad";
export const E2E_USER_ONE_SESSION_ID = "df8a11f2-f20a-43d6-80a0-a213f1efedc1";

export const E2E_USER_TWO_EMAIL = "e2e-user-two@codu.co";
export const E2E_USER_TWO_ID = "a15a104a-0e34-4101-8800-ed25c9231345";
export const E2E_USER_TWO_SESSION_ID = "10134766-bc6c-4b52-83d7-46ec0a4cb95d";

export const E2E_ADMIN_EMAIL = "e2e-admin@codu.co";
export const E2E_ADMIN_ID = "b26b215b-1c37-5212-9911-fe36d342a456";
export const E2E_ADMIN_SESSION_ID = "21245877-cd7d-5c63-94e8-57fd1b5dc986";

// Fixed post IDs to ensure consistent references for comments
export const E2E_PUBLISHED_POST_ID = "e2epubl1";
export const E2E_SCHEDULED_POST_ID = "e2esched";
export const E2E_DRAFT_POST_ID = "e2edraft";

// Link post test constants
export const E2E_LINK_POST_ID = "e2elinkp";
export const E2E_LINK_POST_DRAFT_ID = "e2elnkdr";
export const TEST_LINK_URL = "https://github.com/codu-code/codu";
export const TEST_LINK_TITLE = "Codú - A space for coders";

// ---------------------------------------------------------------------------
// Content-URL routing fixtures (content-urls.spec.ts). The relaunch moves all
// content under stable, urlId-suffixed slugs:
//   - member article : /{username}/{slug}            (slug ends with urlId)
//   - discussion      : /d/{slug}                    (canonical; legacy
//                       /{username}/{slug} 301s here)
//   - source content  : /s/{sourceSlug}/{slug}       (aggregated)
//   - source profile  : /s/{sourceSlug}
// These fixtures pin deterministic slugs + urlIds so the routing/redirect spec
// can construct exact URLs (e.g. /{username}/wrong-words-{urlId}) and assert
// the canonical landing. Seeded in e2e/setup.ts.
// ---------------------------------------------------------------------------

// Member article: title-derived slug ends with the urlId. A request with the
// right urlId but the wrong words must 301 to this canonical slug.
export const E2E_ROUTING_ARTICLE_URL_ID = "rt1a2b3";
export const E2E_ROUTING_ARTICLE_SLUG = `e2e-routing-canonical-article-${E2E_ROUTING_ARTICLE_URL_ID}`;
export const E2E_ROUTING_ARTICLE_TITLE = "E2E Routing Canonical Article";

// Discussion: canonical lives at /d/{slug}; the legacy /{username}/{slug} 301s.
export const E2E_ROUTING_DISCUSSION_URL_ID = "rtd1234";
export const E2E_ROUTING_DISCUSSION_SLUG = `e2e-routing-discussion-${E2E_ROUTING_DISCUSSION_URL_ID}`;
export const E2E_ROUTING_DISCUSSION_TITLE = "E2E Routing Discussion Thread";

// Aggregated source + one of its imported link posts.
export const E2E_ROUTING_SOURCE_SLUG = "e2e-routing-source";
export const E2E_ROUTING_SOURCE_NAME = "E2E Routing Source";
export const E2E_ROUTING_SOURCE_ARTICLE_URL_ID = "rts5678";
export const E2E_ROUTING_SOURCE_ARTICLE_SLUG = `e2e-routing-source-article-${E2E_ROUTING_SOURCE_ARTICLE_URL_ID}`;
export const E2E_ROUTING_SOURCE_ARTICLE_TITLE = "E2E Routing Source Article";
