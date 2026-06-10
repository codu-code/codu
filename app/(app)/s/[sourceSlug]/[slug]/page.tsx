import { notFound, permanentRedirect } from "next/navigation";
import { type Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import {
  getBreadcrumbSchema,
  getNewsArticleSchema,
} from "@/lib/structured-data";
import {
  getFeedArticle,
  resolveAggregatedCanonical,
} from "./_resolvers";
import FeedArticleContent from "./_feedArticleContent";

type Props = { params: Promise<{ sourceSlug: string; slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { sourceSlug, slug } = await props.params;

  const feedArticle = await getFeedArticle(sourceSlug, slug);
  if (!feedArticle) {
    return { title: "Content Not Found" };
  }

  return {
    title: `${feedArticle.title} | Codú Feed`,
    description: feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
    openGraph: {
      title: feedArticle.title,
      description:
        feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
      images:
        feedArticle.ogImageUrl || feedArticle.imageUrl
          ? [feedArticle.ogImageUrl || feedArticle.imageUrl!]
          : undefined,
    },
    alternates: {
      // RSS-aggregated links exist to populate Codú with fresh content for SEO,
      // so we CLAIM them as Codú content (self-canonical), the same as member-
      // shared links. These are a snippet + outbound link (not a full-body copy
      // of the source), so this is aggregator listing content, not duplication.
      canonical: `/s/${sourceSlug}/${feedArticle.slug ?? slug}`,
    },
  };
}

export default async function Page(props: Props) {
  const { sourceSlug, slug } = await props.params;

  const article = await getFeedArticle(sourceSlug, slug);

  if (!article) {
    // Slug-correct: the requested slug may be stale (title edit) but its urlId
    // still resolves to a canonical post. 301 to the canonical slug.
    const canonical = await resolveAggregatedCanonical(sourceSlug, slug);
    if (canonical && canonical.slug !== slug) {
      permanentRedirect(`/s/${sourceSlug}/${canonical.slug}`);
    }
    notFound();
  }

  // Already resolved exactly; guard the rare case where the requested slug
  // differs from the canonical post slug (shouldn't happen on an exact hit,
  // but keeps the canonical contract explicit).
  if (article.slug !== slug) {
    permanentRedirect(`/s/${sourceSlug}/${article.slug}`);
  }

  const newsArticleSchema = getNewsArticleSchema({
    title: article.title,
    excerpt: article.excerpt,
    slug: article.slug,
    externalUrl: article.externalUrl || "",
    coverImage: article.imageUrl || article.ogImageUrl,
    publishedAt: article.publishedAt,
    source: {
      name: article.source?.name || null,
      slug: article.source?.slug || sourceSlug,
      logoUrl: article.source?.logoUrl,
    },
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "https://www.codu.co" },
    { name: "Feed", url: "https://www.codu.co/feed" },
    {
      name: article.source?.name || sourceSlug,
      url: `https://www.codu.co/s/${article.source?.slug || sourceSlug}`,
    },
    { name: article.title },
  ]);

  return (
    <>
      <JsonLd data={newsArticleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <FeedArticleContent sourceSlug={sourceSlug} articleSlug={article.slug} />
    </>
  );
}
