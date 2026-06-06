import RSS from "rss";
import * as Sentry from "@sentry/nextjs";

import { getAllPosts } from "@/server/controllers/post";

export async function GET() {
  const feed = new RSS({
    title: "Codú",
    description:
      "Codú — articles and tutorials for AI builders and indie hackers.",
    generator: "RSS for Node and Next.js",
    feed_url: "https://www.codu.co/feed.xml",
    site_url: "https://www.codu.co/",
    managingEditor: "Niall Maher",
    webMaster: "niall@codu.co (Niall Maher)",
    copyright: `Copyright ${new Date().getFullYear().toString()}, Codú Limited`,
    language: "en-US",
    pubDate: new Date().toUTCString(),
    ttl: 60,
  });

  try {
    const allPosts = await getAllPosts();

    if (allPosts) {
      allPosts.map((post) => {
        if (!post.published) return;
        feed.item({
          title: post.title,
          description: post.excerpt,
          url: `https://www.codu.co/${post.user.username}/${post.slug}`,
          categories: post.tags.map(({ tag }) => tag.title.toLowerCase()),
          author: post.user.name,
          date: post.updatedAt || post.published,
        });
      });
    }

    return new Response(feed.xml({ indent: true }), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return new Response("An error occurred while generating the feed.");
  }
}
