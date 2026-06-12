import type { Metadata } from "next";
import Content from "./feed/_client";
import { JsonLd } from "@/components/JsonLd";
import { getWebSiteSchema } from "@/lib/structured-data/schemas/website";
import { getServerAuthSession } from "@/server/auth";
import { serverApi } from "@/server/trpc/caller";
import { deriveFeedInput } from "./feed/feedQuery";

// The feed is the homepage. It renders at "/" inside the app shell; "/feed"
// 308-redirects here (preserving query) for any old links/bookmarks.
export const metadata: Metadata = {
  title: "Codú — the community for AI builders & indie hackers",
  description:
    "Learn to build with AI, share what you ship, and grow with people doing the same. A curated feed of articles, tips, questions, and links from the community.",
  alternates: { canonical: "/" },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page(props: Props) {
  const sp = await props.searchParams;
  const session = await getServerAuthSession();

  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : (v ?? null);

  // Server-fetch the first feed page so crawlers (and first paint) get real
  // content links in the HTML — AI crawlers don't execute JS. The client
  // infinite query picks this up as initialData (same derived input).
  const input = deriveFeedInput(
    {
      sort: first(sp.sort),
      category: first(sp.category),
      tag: first(sp.tag),
      type: first(sp.type),
      view: first(sp.view),
    },
    !!session?.user,
  );

  const initialFeed = await serverApi()
    .then((api) => api.content.getFeed(input))
    .catch(() => null);

  return (
    <>
      <JsonLd data={getWebSiteSchema()} />
      <h1 className="sr-only">
        Codú — the community for AI builders &amp; indie hackers
      </h1>
      <Content initialFeed={initialFeed} />
    </>
  );
}
