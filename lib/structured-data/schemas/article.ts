import type { Article, WithContext } from "../types";
import { getOrganizationRef } from "./organization";
import { getPersonRef } from "./person";

const BASE_URL = "https://www.codu.co";

interface ArticleData {
  title: string;
  excerpt?: string | null;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTime?: number | null;
  canonicalUrl?: string | null;
  tags?: Array<{ title: string }>;
  author: {
    name: string | null;
    username: string | null;
    image?: string | null;
    bio?: string | null;
  };
}

/**
 * Generate Article/BlogPosting schema for user-created articles
 */
export function getArticleSchema(
  article: ArticleData,
  options?: { schemaType?: "Article" | "BlogPosting" },
): WithContext<Article> {
  const schemaType = options?.schemaType ?? "BlogPosting";

  // Build the OG image URL with article metadata
  const ogImageUrl = `${BASE_URL}/og?title=${encodeURIComponent(article.title)}&author=${encodeURIComponent(article.author.name || "")}&readTime=${article.readingTime || 5}&date=${article.updatedAt || article.publishedAt || ""}`;

  // Determine the canonical URL
  const mainEntityUrl =
    article.canonicalUrl ||
    `${BASE_URL}/${article.author.username}/${article.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: article.title,
    ...(article.excerpt && { description: article.excerpt }),
    image: ogImageUrl,
    author: getPersonRef({
      name: article.author.name,
      username: article.author.username,
      image: article.author.image,
      bio: article.author.bio,
    }),
    publisher: getOrganizationRef(),
    datePublished:
      article.publishedAt || article.updatedAt || new Date().toISOString(),
    ...(article.updatedAt && { dateModified: article.updatedAt }),
    mainEntityOfPage: mainEntityUrl,
    ...(article.tags &&
      article.tags.length > 0 && {
        keywords: article.tags.map((t) => t.title).join(", "),
      }),
    // Approximate word count from reading time (avg 200 words/min)
    ...(article.readingTime && { wordCount: article.readingTime * 200 }),
  };
}
