import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Don't allow crawlers on the following routes
      disallow: [
        "/alpha/",
        "/api/",
        "/settings/",
        "/metrics/",
        "/notifications/",
        "/create/",
        "/my-posts/",
        "/hub/", // This should be crawled when completed
      ],
    },
    sitemap: "https://www.codu.co/sitemap.xml",
  };
}
