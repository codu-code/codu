import type { Metadata } from "next";
import Content from "./feed/_client";

// The feed is the homepage. It renders at "/" inside the app shell; "/feed"
// 308-redirects here (preserving query) for any old links/bookmarks.
export const metadata: Metadata = {
  title: "Codú — the community for AI builders & indie hackers",
  description:
    "Learn to build with AI, share what you ship, and grow with people doing the same. A curated feed of articles, tips, questions, and links from the community.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <Content />;
}
