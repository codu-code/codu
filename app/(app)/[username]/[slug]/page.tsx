import React from "react";
import type { RenderableTreeNode } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import Link from "next/link";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import DiscussionArea from "@/components/Discussion/DiscussionArea";
import { ArticleActionBarWrapper } from "@/components/ArticleActionBar";
import { InlineAuthorBio } from "@/components/ContentDetail";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import ArticleAdminPanel from "@/components/ArticleAdminPanel/ArticleAdminPanel";
import { type Metadata } from "next";
import { getCamelCaseFromLower } from "@/utils/utils";
import { generateHTML } from "@tiptap/core";
import { RenderExtensions } from "@/components/editor/editor/extensions/render-extensions";
import sanitizeHtml from "sanitize-html";
import type { JSONContent } from "@tiptap/core";
import NotFound from "@/components/NotFound/NotFound";
import { db } from "@/server/db";
import { posts, user, feed_sources, post_tags, tag } from "@/server/db/schema";
import { eq, and, lte } from "drizzle-orm";
import FeedArticleContent from "./_feedArticleContent";
import LinkContentDetail from "./_linkContentDetail";
import UserLinkDetail from "./_userLinkDetail";
import { JsonLd } from "@/components/JsonLd";
import {
  getArticleSchema,
  getBreadcrumbSchema,
  getNewsArticleSchema,
} from "@/lib/structured-data";

type Props = { params: Promise<{ username: string; slug: string }> };

// Helper to fetch user article by username and slug (uses new posts table)
async function getUserPost(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
  });

  if (!userRecord) return null;

  // Then find published article by slug that belongs to this user - using explicit JOIN
  const postResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTime: posts.readingTime,
      slug: posts.slug,
      excerpt: posts.excerpt,
      canonicalUrl: posts.canonicalUrl,
      showComments: posts.showComments,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      type: posts.type,
      // Author info via JOIN
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorUsername: user.username,
      authorBio: user.bio,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, postSlug),
        eq(posts.authorId, userRecord.id),
        eq(posts.status, "published"),
        eq(posts.type, "article"),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  if (postResults.length === 0) return null;

  const postRecord = postResults[0];

  // Fetch tags separately using explicit JOIN
  const tagsResult = await db
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, postRecord.id));

  // Map to expected shape for backwards compatibility
  return {
    ...postRecord,
    published: postRecord.publishedAt,
    readTimeMins: postRecord.readingTime,
    upvotes: postRecord.upvotesCount,
    downvotes: postRecord.downvotesCount,
    tags: tagsResult.map((t) => ({ tag: { title: t.title } })),
    user: {
      id: postRecord.authorId,
      name: postRecord.authorName,
      image: postRecord.authorImage,
      username: postRecord.authorUsername,
      bio: postRecord.authorBio,
    },
  };
}

// Helper to fetch user-created link post by username and slug (user shared a link)
async function getUserLinkPost(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
  });

  if (!userRecord) return null;

  // Find published link post by slug that belongs to this user (no sourceId)
  const linkPostResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      excerpt: posts.excerpt,
      slug: posts.slug,
      externalUrl: posts.externalUrl,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      readingTime: posts.readingTime,
      showComments: posts.showComments,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      type: posts.type,
      // Author info via JOIN
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image,
      authorUsername: user.username,
      authorBio: user.bio,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(
      and(
        eq(posts.slug, postSlug),
        eq(posts.authorId, userRecord.id),
        eq(posts.status, "published"),
        eq(posts.type, "link"),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  if (linkPostResults.length === 0) return null;

  const linkPost = linkPostResults[0];

  // Fetch tags separately using explicit JOIN
  const tagsResult = await db
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, linkPost.id));

  // Map to expected shape
  return {
    ...linkPost,
    published: linkPost.publishedAt,
    readTimeMins: linkPost.readingTime,
    upvotes: linkPost.upvotesCount,
    downvotes: linkPost.downvotesCount,
    tags: tagsResult.map((t) => ({ tag: { title: t.title } })),
    user: {
      id: linkPost.authorId,
      name: linkPost.authorName,
      image: linkPost.authorImage,
      username: linkPost.authorUsername,
      bio: linkPost.authorBio,
    },
  };
}

// Helper to fetch link post by source slug and article slug (uses new posts table)
async function getFeedArticle(
  sourceSlug: string,
  articleSlugOrShortId: string,
) {
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) return null;

  // Find link post by slug that belongs to this source - using explicit JOIN
  const linkPostResults = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      excerpt: posts.excerpt,
      slug: posts.slug,
      externalUrl: posts.externalUrl,
      coverImage: posts.coverImage,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      showComments: posts.showComments,
      // Source info
      sourceName: feed_sources.name,
      sourceSlug: feed_sources.slug,
      sourceLogo: feed_sources.logoUrl,
      sourceWebsite: feed_sources.websiteUrl,
    })
    .from(posts)
    .leftJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
    .where(
      and(
        eq(posts.slug, articleSlugOrShortId),
        eq(posts.sourceId, source.id),
        eq(posts.type, "link"),
        eq(posts.status, "published"),
      ),
    )
    .limit(1);

  if (linkPostResults.length === 0) return null;

  const linkPost = linkPostResults[0];

  // Map to expected shape for backwards compatibility
  return {
    ...linkPost,
    shortId: linkPost.slug.split("-").pop() || "",
    imageUrl: linkPost.coverImage,
    ogImageUrl: linkPost.coverImage,
    upvotes: linkPost.upvotesCount,
    downvotes: linkPost.downvotesCount,
    source: {
      name: linkPost.sourceName,
      slug: linkPost.sourceSlug,
      logoUrl: linkPost.sourceLogo,
      websiteUrl: linkPost.sourceWebsite,
    },
  };
}

// Helper to fetch link content (uses new posts table - same as getFeedArticle)
async function getLinkContent(sourceSlug: string, contentSlug: string) {
  // Delegate to getFeedArticle since they query the same table now
  return getFeedArticle(sourceSlug, contentSlug);
}

// Helper to fetch user article content (uses new posts table - same as getUserPost)
async function getUserArticleContent(username: string, contentSlug: string) {
  // Delegate to getUserPost since they query the same table now
  return getUserPost(username, contentSlug);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { username, slug } = params;

  // First try user post (legacy Post table)
  const userPost = await getUserPost(username, slug);
  if (userPost) {
    const tags = userPost.tags.map((tag) => tag.tag.title);
    const host = (await headers()).get("host") || "";
    const authorName = userPost.user.name || "Unknown";

    return {
      title: `${userPost.title} | by ${authorName} | Codú`,
      authors: {
        name: authorName,
        url: `https://www.${host}/${userPost.user.username}`,
      },
      keywords: tags,
      description: userPost.excerpt ?? undefined,
      openGraph: {
        description: userPost.excerpt ?? undefined,
        type: "article",
        images: [
          `/og?title=${encodeURIComponent(
            userPost.title,
          )}&readTime=${userPost.readTimeMins}&author=${encodeURIComponent(
            authorName,
          )}&date=${userPost.updatedAt}`,
        ],
        siteName: "Codú",
      },
      twitter: {
        description: userPost.excerpt ?? undefined,
        images: [`/og?title=${encodeURIComponent(userPost.title)}`],
      },
      alternates: {
        canonical: userPost.canonicalUrl,
      },
    };
  }

  // Then try user ARTICLE content (new unified Content table)
  const userArticle = await getUserArticleContent(username, slug);
  if (userArticle && userArticle.user) {
    const tags = userArticle.tags?.map((t) => t.tag.title) || [];
    const host = (await headers()).get("host") || "";
    const articleAuthorName = userArticle.user.name || "Unknown";

    return {
      title: `${userArticle.title} | by ${articleAuthorName} | Codú`,
      authors: {
        name: articleAuthorName,
        url: `https://www.${host}/${userArticle.user.username}`,
      },
      keywords: tags,
      description: userArticle.excerpt,
      openGraph: {
        description: userArticle.excerpt || "",
        type: "article",
        images: [
          `/og?title=${encodeURIComponent(
            userArticle.title,
          )}&readTime=${userArticle.readTimeMins || 5}&author=${encodeURIComponent(
            userArticle.user.name || "",
          )}&date=${userArticle.updatedAt}`,
        ],
        siteName: "Codú",
      },
      twitter: {
        description: userArticle.excerpt || "",
        images: [`/og?title=${encodeURIComponent(userArticle.title)}`],
      },
      alternates: {
        canonical: userArticle.canonicalUrl,
      },
    };
  }

  // Try user-created link post (user shared a link)
  const userLinkPost = await getUserLinkPost(username, slug);
  if (userLinkPost && userLinkPost.user) {
    const host = (await headers()).get("host") || "";
    const linkAuthorName = userLinkPost.user.name || "Unknown";

    return {
      title: `${userLinkPost.title} | shared by ${linkAuthorName} | Codú`,
      authors: {
        name: linkAuthorName,
        url: `https://www.${host}/${userLinkPost.user.username}`,
      },
      description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
      openGraph: {
        title: userLinkPost.title,
        description: userLinkPost.excerpt || `Link shared by ${linkAuthorName}`,
        images: userLinkPost.coverImage ? [userLinkPost.coverImage] : undefined,
        siteName: "Codú",
      },
    };
  }

  // Then try feed article (legacy aggregated_article table)
  const feedArticle = await getFeedArticle(username, slug);
  if (feedArticle) {
    return {
      title: `${feedArticle.title} | Codú Feed`,
      description:
        feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
      openGraph: {
        title: feedArticle.title,
        description:
          feedArticle.excerpt || `Discussion about ${feedArticle.title}`,
        images:
          feedArticle.ogImageUrl || feedArticle.imageUrl
            ? [feedArticle.ogImageUrl || feedArticle.imageUrl!]
            : undefined,
      },
    };
  }

  // Try unified content table (new LINK type items)
  const linkContent = await getLinkContent(username, slug);
  if (linkContent) {
    return {
      title: `${linkContent.title} | Codú Feed`,
      description:
        linkContent.excerpt || `Discussion about ${linkContent.title}`,
      openGraph: {
        title: linkContent.title,
        description:
          linkContent.excerpt || `Discussion about ${linkContent.title}`,
        images:
          linkContent.ogImageUrl || linkContent.imageUrl
            ? [linkContent.ogImageUrl || linkContent.imageUrl!]
            : undefined,
      },
    };
  }

  return { title: "Content Not Found" };
}

const parseJSON = (str: string): JSONContent | null => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const renderSanitizedTiptapContent = (jsonContent: JSONContent) => {
  const rawHtml = generateHTML(jsonContent, [...RenderExtensions]);
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "iframe",
      "h1",
      "h2",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "class"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
      "*": ["class", "id", "style"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
    ],
  });
};

const UnifiedPostPage = async (props: Props) => {
  const params = await props.params;
  const session = await getServerAuthSession();
  const { username, slug } = params;

  const host = (await headers()).get("host") || "";

  // First try user post
  const userPost = await getUserPost(username, slug);

  if (userPost) {
    // Render user article
    const bodyContent = userPost.body ?? "";
    const parsedBody = parseJSON(bodyContent);
    const isTiptapContent = parsedBody?.type === "doc";

    let renderedContent: string | RenderableTreeNode;

    if (isTiptapContent && parsedBody) {
      const jsonContent = parsedBody;
      renderedContent = renderSanitizedTiptapContent(jsonContent);
    } else {
      const ast = Markdoc.parse(bodyContent);
      const transformedContent = Markdoc.transform(ast, config);
      renderedContent = Markdoc.renderers.react(transformedContent, React, {
        components: markdocComponents,
      }) as unknown as string;
    }

    // Prepare JSON-LD structured data
    const articleSchema = getArticleSchema({
      title: userPost.title,
      excerpt: userPost.excerpt,
      slug: userPost.slug,
      publishedAt: userPost.published,
      updatedAt: userPost.updatedAt,
      readingTime: userPost.readTimeMins,
      canonicalUrl: userPost.canonicalUrl,
      tags: userPost.tags.map((t) => ({ title: t.tag.title })),
      author: {
        name: userPost.user.name,
        username: userPost.user.username,
        image: userPost.user.image,
        bio: userPost.user.bio,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: userPost.user.name || "Author",
        url: `https://www.codu.co/${userPost.user.username}`,
      },
      { name: userPost.title },
    ]);

    return (
      <>
        {/* JSON-LD Structured Data for SEO */}
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />

        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Breadcrumb navigation */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Link
              href="/feed"
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Feed
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/${userPost.user.username}`}
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              {userPost.user.name}
            </Link>
          </nav>

          {/* Article card - contains everything in one cohesive unit */}
          <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            {/* Author info */}
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
              <Link
                href={`/${userPost.user.username}`}
                className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {userPost.user.image ? (
                  <img
                    src={userPost.user.image}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                    {userPost.user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <span className="font-medium">{userPost.user.name}</span>
              </Link>
              {userPost.published && (
                <>
                  <span aria-hidden="true">·</span>
                  <time>
                    {new Date(userPost.published).toLocaleDateString("en-IE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </>
              )}
              {userPost.readTimeMins && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{userPost.readTimeMins} min read</span>
                </>
              )}
            </div>

            {/* Article content */}
            <div className="prose mx-auto max-w-none dark:prose-invert lg:prose-lg">
              {!isTiptapContent && <h1>{userPost.title}</h1>}

              {isTiptapContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderedContent ?? <NotFound />,
                  }}
                  className="tiptap-content"
                />
              ) : (
                <div>
                  {Markdoc.renderers.react(renderedContent, React, {
                    components: markdocComponents,
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            {userPost.tags.length > 0 && (
              <section className="mt-6 flex flex-wrap gap-3">
                {userPost.tags.map(({ tag }) => (
                  <Link
                    href={`/feed?tag=${tag.title.toLowerCase()}`}
                    key={tag.title}
                    className="rounded-full bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700"
                  >
                    {getCamelCaseFromLower(tag.title)}
                  </Link>
                ))}
              </section>
            )}

            {/* Compact inline author bio */}
            <div className="mt-8">
              <InlineAuthorBio
                name={userPost.user.name || "Unknown"}
                username={userPost.user.username || ""}
                image={userPost.user.image}
                bio={userPost.user.bio}
              />
            </div>

            {/* Action bar - just above discussion */}
            <div className="mt-8">
              <ArticleActionBarWrapper
                postId={userPost.id}
                postTitle={userPost.title}
                postUrl={`https://${host}/${userPost.user.username}/${userPost.slug}`}
                postUsername={userPost.user.username || ""}
                initialUpvotes={userPost.upvotes ?? 0}
                initialDownvotes={userPost.downvotes ?? 0}
              />
            </div>

            {/* Discussion section - inside the card */}
            <section id="discussion" className="mt-8">
              {userPost.showComments ? (
                <DiscussionArea contentId={userPost.id} noWrapper />
              ) : (
                <div className="py-4">
                  <p className="italic text-neutral-500 dark:text-neutral-400">
                    Comments are disabled for this post
                  </p>
                </div>
              )}
            </section>
          </article>
        </div>

        {session && session?.user?.role === "ADMIN" && (
          <ArticleAdminPanel session={session} postId={userPost.id} />
        )}
      </>
    );
  }

  // Then try user ARTICLE content (new unified Content table)
  const userArticle = await getUserArticleContent(username, slug);

  if (userArticle && userArticle.user && userArticle.body) {
    // Render user article from Content table
    const parsedBody = parseJSON(userArticle.body);
    const isTiptapContent = parsedBody?.type === "doc";

    let renderedContent: string | RenderableTreeNode;

    if (isTiptapContent && parsedBody) {
      const jsonContent = parsedBody;
      renderedContent = renderSanitizedTiptapContent(jsonContent);
    } else {
      const ast = Markdoc.parse(userArticle.body);
      const transformedContent = Markdoc.transform(ast, config);
      renderedContent = Markdoc.renderers.react(transformedContent, React, {
        components: markdocComponents,
      }) as unknown as string;
    }

    // Prepare JSON-LD structured data
    const articleSchema = getArticleSchema({
      title: userArticle.title,
      excerpt: userArticle.excerpt,
      slug: userArticle.slug,
      publishedAt: userArticle.publishedAt,
      updatedAt: userArticle.updatedAt,
      readingTime: userArticle.readTimeMins,
      canonicalUrl: userArticle.canonicalUrl,
      tags: userArticle.tags?.map((t) => ({ title: t.tag.title })),
      author: {
        name: userArticle.user.name,
        username: userArticle.user.username,
        image: userArticle.user.image,
        bio: userArticle.user.bio,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: userArticle.user.name || "Author",
        url: `https://www.codu.co/${userArticle.user.username}`,
      },
      { name: userArticle.title },
    ]);

    return (
      <>
        {/* JSON-LD Structured Data for SEO */}
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />

        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Breadcrumb navigation */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Link
              href="/feed"
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              Feed
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/${userArticle.user.username}`}
              className="hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              {userArticle.user.name}
            </Link>
          </nav>

          {/* Article card - contains everything in one cohesive unit */}
          <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
            {/* Author info */}
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
              <Link
                href={`/${userArticle.user.username}`}
                className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                {userArticle.user.image ? (
                  <img
                    src={userArticle.user.image}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
                    {userArticle.user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <span className="font-medium">{userArticle.user.name}</span>
              </Link>
              {userArticle.publishedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <time>
                    {new Date(userArticle.publishedAt).toLocaleDateString(
                      "en-IE",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </time>
                </>
              )}
              {userArticle.readTimeMins && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{userArticle.readTimeMins} min read</span>
                </>
              )}
            </div>

            {/* Article content */}
            <div className="prose mx-auto max-w-none dark:prose-invert lg:prose-lg">
              {!isTiptapContent && <h1>{userArticle.title}</h1>}

              {isTiptapContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderedContent ?? <NotFound />,
                  }}
                  className="tiptap-content"
                />
              ) : (
                <div>
                  {Markdoc.renderers.react(renderedContent, React, {
                    components: markdocComponents,
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            {userArticle.tags && userArticle.tags.length > 0 && (
              <section className="mt-6 flex flex-wrap gap-3">
                {userArticle.tags.map(({ tag }) => (
                  <Link
                    href={`/feed?tag=${tag.title.toLowerCase()}`}
                    key={tag.title}
                    className="rounded-full bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700"
                  >
                    {getCamelCaseFromLower(tag.title)}
                  </Link>
                ))}
              </section>
            )}

            {/* Compact inline author bio */}
            <div className="mt-8">
              <InlineAuthorBio
                name={userArticle.user.name || "Unknown"}
                username={userArticle.user.username || ""}
                image={userArticle.user.image}
                bio={userArticle.user.bio}
              />
            </div>

            {/* Action bar - just above discussion */}
            <div className="mt-8">
              <ArticleActionBarWrapper
                postId={userArticle.id}
                postTitle={userArticle.title}
                postUrl={`https://${host}/${userArticle.user.username}/${userArticle.slug}`}
                postUsername={userArticle.user.username || ""}
                initialUpvotes={userArticle.upvotes ?? 0}
                initialDownvotes={userArticle.downvotes ?? 0}
              />
            </div>

            {/* Discussion section - inside the card */}
            <section id="discussion" className="mt-8">
              {userArticle.showComments ? (
                <DiscussionArea contentId={userArticle.id} noWrapper />
              ) : (
                <div className="py-4">
                  <p className="italic text-neutral-500 dark:text-neutral-400">
                    Comments are disabled for this article
                  </p>
                </div>
              )}
            </section>
          </article>
        </div>

        {session && session?.user?.role === "ADMIN" && (
          <ArticleAdminPanel session={session} postId={userArticle.id} />
        )}
      </>
    );
  }

  // Try user-created link post (user shared a link)
  const userLinkPost = await getUserLinkPost(username, slug);

  if (userLinkPost && userLinkPost.user) {
    // Render user link post
    return <UserLinkDetail username={username} contentSlug={slug} />;
  }

  // Then try feed article (legacy aggregated_article table)
  const feedArticle = await getFeedArticle(username, slug);

  if (feedArticle) {
    // Prepare JSON-LD structured data for feed article
    const newsArticleSchema = getNewsArticleSchema({
      title: feedArticle.title,
      excerpt: feedArticle.excerpt,
      slug: feedArticle.slug,
      externalUrl: feedArticle.externalUrl || "",
      coverImage: feedArticle.imageUrl || feedArticle.ogImageUrl,
      publishedAt: feedArticle.publishedAt,
      source: {
        name: feedArticle.source?.name || null,
        slug: feedArticle.source?.slug || username,
        logoUrl: feedArticle.source?.logoUrl,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: feedArticle.source?.name || username,
        url: `https://www.codu.co/${feedArticle.source?.slug || username}`,
      },
      { name: feedArticle.title },
    ]);

    // Render feed article with JSON-LD
    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <FeedArticleContent sourceSlug={username} articleSlug={slug} />
      </>
    );
  }

  // Try unified content table (new LINK type items)
  const linkContent = await getLinkContent(username, slug);

  if (linkContent) {
    // Prepare JSON-LD structured data for link content
    const newsArticleSchema = getNewsArticleSchema({
      title: linkContent.title,
      excerpt: linkContent.excerpt,
      slug: linkContent.slug,
      externalUrl: linkContent.externalUrl || "",
      coverImage: linkContent.imageUrl || linkContent.ogImageUrl,
      publishedAt: linkContent.publishedAt,
      source: {
        name: linkContent.source?.name || null,
        slug: linkContent.source?.slug || username,
        logoUrl: linkContent.source?.logoUrl,
      },
    });

    const breadcrumbSchema = getBreadcrumbSchema([
      { name: "Home", url: "https://www.codu.co" },
      { name: "Feed", url: "https://www.codu.co/feed" },
      {
        name: linkContent.source?.name || username,
        url: `https://www.codu.co/${linkContent.source?.slug || username}`,
      },
      { name: linkContent.title },
    ]);

    // Render link content with JSON-LD
    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <LinkContentDetail sourceSlug={username} contentSlug={slug} />
      </>
    );
  }

  // Nothing found
  return notFound();
};

export default UnifiedPostPage;
