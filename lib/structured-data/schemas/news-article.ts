import type { Article, Organization, WithContext } from "../types";

const BASE_URL = "https://www.codu.co";

interface FeedArticleData {
  title: string;
  excerpt?: string | null;
  slug: string;
  externalUrl: string;
  coverImage?: string | null;
  publishedAt?: string | null;
  source: {
    name: string | null;
    slug: string | null;
    logoUrl?: string | null;
  };
}

/**
 * Generate NewsArticle schema for aggregated feed articles
 * These are articles from external sources displayed on Codu
 */
export function getNewsArticleSchema(
  article: FeedArticleData,
): WithContext<Article> {
  // Publisher is the original source, not Codu
  const publisher: Organization = {
    "@type": "Organization",
    name: article.source.name || "External Source",
    url: article.externalUrl,
    ...(article.source.logoUrl && {
      logo: {
        "@type": "ImageObject",
        url: article.source.logoUrl,
      },
    }),
  };

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    ...(article.excerpt && { description: article.excerpt }),
    ...(article.coverImage && { image: article.coverImage }),
    // Link to the original article
    url: article.externalUrl,
    // The Codu discussion page is the main entity
    mainEntityOfPage: `${BASE_URL}/${article.source.slug}/${article.slug}`,
    datePublished: article.publishedAt || new Date().toISOString(),
    publisher,
    // Author is the source organization for feed articles
    author: {
      "@type": "Organization",
      name: article.source.name || "External Source",
      url: `${BASE_URL}/${article.source.slug}`,
    },
  };
}
