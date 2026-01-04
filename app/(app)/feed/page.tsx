import Content from "./_client";

export const metadata = {
  title: "Codú Feed - Curated Developer Content",
  description:
    "Discover the best developer articles from across the web, curated by the Codú community. Upvote, save, and find content that matters to you.",
  keywords: [
    "developer feed",
    "programming articles",
    "tech news",
    "web development",
    "JavaScript",
    "React",
    "TypeScript",
    "Python",
    "DevOps",
    "career",
    "curated content",
  ],
};

export default async function Page() {
  return <Content />;
}
