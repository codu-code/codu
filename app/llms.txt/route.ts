// Served at /llms.txt — a concise, machine-readable summary for LLMs/AEO agents.
// Static content, revalidated daily.
export const revalidate = 86400;

const BODY = `# Codú

> Codú is a community for AI builders and indie hackers — a place to share what
> you're building, ask questions, swap lessons, and read fresh writing and links
> from across the ecosystem.

## What you'll find
- Member articles, today-I-learned notes, and resource shares
- Discussions and questions from the community
- An aggregated feed of curated writing from sources across the web

## Key links
- Home / feed: https://www.codu.co/
- Discussions: https://www.codu.co/discussions
- Articles: https://www.codu.co/?type=article
- Sitemap: https://www.codu.co/sitemap.xml

## Notes
- All content canonicalises to www.codu.co.
- For crawl rules see https://www.codu.co/robots.txt.
`;

export function GET(): Response {
  return new Response(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
