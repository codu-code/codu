import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { posts, post_tags, tag, user, feed_sources } from "@/server/db/schema";
import { and, desc, eq, lte } from "drizzle-orm";
import { getCamelCaseFromLower } from "@/utils/utils";

type Props = { params: Promise<{ slug: string }> };

const MAX_POSTS = 50;

async function getTagBySlug(slug: string) {
  return db.query.tag.findFirst({
    where: eq(tag.slug, slug),
  });
}

// Published posts carrying this tag, newest first. Joins to the author (member
// content) and feed source (aggregated content) so each row can be linked to
// its canonical URL per the live scheme.
async function getPostsForTag(tagId: number) {
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
    .limit(MAX_POSTS);
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
  const { slug } = await props.params;
  const tagRow = await getTagBySlug(slug);

  if (!tagRow) {
    return { title: "Tag Not Found | Codú" };
  }

  const label = getCamelCaseFromLower(tagRow.title);
  const description =
    tagRow.description ||
    `Articles, discussions, and resources tagged #${label} on Codú.`;

  return {
    title: `#${label} — Codú`,
    description,
    alternates: { canonical: `/tag/${slug}` },
    openGraph: {
      title: `#${label} — Codú`,
      description,
      siteName: "Codú",
    },
  };
}

export default async function TagPage(props: Props) {
  const { slug } = await props.params;
  const tagRow = await getTagBySlug(slug);

  if (!tagRow) {
    notFound();
  }

  const label = getCamelCaseFromLower(tagRow.title);
  const taggedPosts = await getPostsForTag(tagRow.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
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
    </div>
  );
}
