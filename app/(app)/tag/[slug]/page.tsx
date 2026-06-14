import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { posts, post_tags, tag, user, feed_sources } from "@/server/db/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { getCamelCaseFromLower } from "@/utils/utils";
import { ogMainImage } from "@/lib/og/url";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const PAGE_SIZE = 30;

// Strict ?page=N parsing: undefined → 1, otherwise an all-digit integer >= 1.
// Anything else (page=abc, page=0, page=-2, page=1.5) returns null → 404,
// so invalid URLs never render duplicate/soft-404 content.
function parsePage(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return 1;
  if (!/^[0-9]+$/.test(value)) return null;
  const page = Number.parseInt(value, 10);
  return page >= 1 ? page : null;
}

// Page 1 canonicalises to the bare tag URL (so /tag/x and /tag/x?page=1
// dedupe); later pages self-canonical with their page param.
function canonicalPath(slug: string, page: number): string {
  return page === 1 ? `/tag/${slug}` : `/tag/${slug}?page=${page}`;
}

async function getTagBySlug(slug: string) {
  return db.query.tag.findFirst({
    where: eq(tag.slug, slug),
  });
}

// Published posts carrying this tag, newest first. Author + source joins so each
// row can be linked to its canonical URL. Fetches PAGE_SIZE + 1 rows so the
// extra row acts as a "has next page" probe without a separate count query.
async function getPostsForTag(tagId: number, page: number) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      excerpt: posts.excerpt,
      slug: posts.slug,
      type: posts.type,
      publishedAt: posts.publishedAt,
      authorUsername: user.username,
      authorName: user.name,
      sourceSlug: feed_sources.slug,
    })
    .from(post_tags)
    .innerJoin(posts, eq(post_tags.postId, posts.id))
    .leftJoin(user, eq(posts.authorId, user.id))
    .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
    .where(
      and(
        eq(post_tags.tagId, tagId),
        eq(posts.status, "published"),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
}

// The stored slug already carries the trailing urlId, so it is used as-is.
// discussion/question → /d/{slug}; aggregated (sourceSlug) → /s/{source}/{slug};
// member → /{username}/{slug}.
function canonicalHref(post: {
  type: string;
  slug: string;
  authorUsername: string | null;
  sourceSlug: string | null;
}): string | null {
  if (post.type === "discussion" || post.type === "question") {
    return `/d/${post.slug}`;
  }
  if (post.sourceSlug) {
    return `/s/${post.sourceSlug}/${post.slug}`;
  }
  if (post.authorUsername) {
    return `/${post.authorUsername}/${post.slug}`;
  }
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const [{ slug }, search] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const page = parsePage(search.page);

  if (page === null) {
    return { title: "Tag Not Found | Codú" };
  }

  const tagRow = await getTagBySlug(slug);

  if (!tagRow) {
    return { title: "Tag Not Found | Codú" };
  }

  const label = getCamelCaseFromLower(tagRow.title);
  const pageSuffix = page > 1 ? ` — Page ${page}` : "";
  const title = `#${label}${pageSuffix} — Codú`;
  const description =
    tagRow.description ||
    `Articles, discussions, and resources tagged #${label} on Codú.`;

  const ogImage = ogMainImage("articles");

  return {
    title,
    description,
    alternates: { canonical: canonicalPath(slug, page) },
    openGraph: {
      title,
      description,
      siteName: "Codú",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function TagPage(props: Props) {
  const [{ slug }, search] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const page = parsePage(search.page);

  if (page === null) {
    notFound();
  }

  const tagRow = await getTagBySlug(slug);

  if (!tagRow) {
    notFound();
  }

  const label = getCamelCaseFromLower(tagRow.title);
  const fetched = await getPostsForTag(tagRow.id, page);

  // Past the last page → hard 404 rather than an empty shell. An empty tag is
  // only a valid render on page 1.
  if (fetched.length === 0 && page > 1) {
    notFound();
  }

  const hasNextPage = fetched.length > PAGE_SIZE;
  const taggedPosts = fetched.slice(0, PAGE_SIZE);

  // Prev link to page 1 points at the bare URL to match its canonical.
  const prevHref =
    page > 1
      ? page === 2
        ? `/tag/${slug}`
        : `/tag/${slug}?page=${page - 1}`
      : null;
  const nextHref = hasNextPage ? `/tag/${slug}?page=${page + 1}` : null;

  return (
    <div className="mx-auto max-w-3xl px-0 py-4 sm:px-4 sm:py-8">
      <p className="eyebrow">
        <span className="slash">{"// "}</span>
        Tag
      </p>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-fg md:text-4xl">
        #{label}
      </h1>
      {tagRow.description && (
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {tagRow.description}
        </p>
      )}

      {taggedPosts.length === 0 ? (
        <p className="mt-8 italic text-muted">
          No published posts with this tag yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-hairline border-t border-hairline">
          {taggedPosts.map((post) => {
            const href = canonicalHref(post);
            if (!href) return null;
            return (
              <li key={post.id} className="py-5">
                <Link href={href} className="group block">
                  <h2 className="font-display text-xl font-bold tracking-tight text-fg group-hover:text-accent">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                      {post.excerpt}
                    </p>
                  )}
                  {post.authorName && (
                    <p className="mt-2 font-mono text-xs text-faint">
                      by {post.authorName}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(prevHref || nextHref) && (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t border-hairline pt-6 font-mono text-sm"
        >
          {prevHref ? (
            <Link
              href={prevHref}
              rel="prev"
              className="text-muted hover:text-accent"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-faint">Page {page}</span>
          {nextHref ? (
            <Link
              href={nextHref}
              rel="next"
              className="text-muted hover:text-accent"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
