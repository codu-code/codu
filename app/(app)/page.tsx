import type { Metadata } from "next";
import Content from "./feed/_client";
import { JsonLd } from "@/components/JsonLd";
import { getWebSiteSchema } from "@/lib/structured-data/schemas/website";

// The feed is the homepage. It renders at "/" inside the app shell; "/feed"
// 308-redirects here (preserving query) for any old links/bookmarks.
export const metadata: Metadata = {
  title: "Codú — the community for AI builders & indie hackers",
  description:
    "Learn to build with AI, share what you ship, and grow with people doing the same. A curated feed of articles, tips, questions, and links from the community.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={getWebSiteSchema()} />
      <h1 className="sr-only">
        Codú — the community for AI builders &amp; indie hackers
      </h1>
      <Content />
    </>
  );
}
