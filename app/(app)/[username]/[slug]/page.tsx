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
import {
  posts,
  user,
  feed_sources,
  post_tags,
  tag,
  comments,
} from "@/server/db/schema";
import { eq, and, lte, inArray, count, isNull } from "drizzle-orm";
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

async function getUserPost(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
  });

  if (!userRecord) return null;

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
        // Text-content kinds all render via the article reader (title + body +
        // discussion). Links have their own resolver below.
        inArray(posts.type, [
          "article",
          "discussion",
          "question",
          "til",
          "resource",
        ]),
        lte(posts.publishedAt, new Date().toISOString()),
      ),
    )
    .limit(1);

  if (postResults.length === 0) return null;

  const postRecord = postResults[0];

  const tagsResult = await db
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, postRecord.id));

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

async function getUserLinkPost(username: string, postSlug: string) {
  const userRecord = await db.query.user.findFirst({
    columns: { id: true },
    where: eq(user.username, username),
  });

  if (!userRecord) return null;

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

  const tagsResult = await db
    .select({ title: tag.title })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, linkPost.id));

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

async function getFeedArticle(
  sourceSlug: string,
  articleSlugOrShortId: string,
) {
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, sourceSlug),
  });

  if (!source) return null;

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

async function getLinkContent(sourceSlug: string, contentSlug: string) {
  return getFeedArticle(sourceSlug, contentSlug);
}

async function getUserArticleContent(username: string, contentSlug: string) {
  return getUserPost(username, contentSlug);
}

// Mirrors discussion.getContentDiscussionCount so the user-post reader renders
// the same "Discussion {N}" heading as the source-content reader.
async function getDiscussionCount(contentId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(comments)
    .where(and(eq(comments.postId, contentId), isNull(comments.deletedAt)));
  return result?.count ?? 0;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { username, slug } = params;

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

  const userPost = await getUserPost(username, slug);

  if (userPost) {
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

    const discussionCount = await getDiscussionCount(userPost.id);

    return (
      <>
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />

        <div className="mx-auto max-w-3xl px-4 py-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-fg">
              Feed
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${userPost.user.username}`} className="hover:text-fg">
              {userPost.user.name}
            </Link>
          </nav>

          <article className="py-2">
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <Link
                href={`/${userPost.user.username}`}
                className="flex items-center gap-2 hover:text-fg"
              >
                {userPost.user.image ? (
                  <img
                    src={userPost.user.image}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
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

            {userPost.tags.length > 0 && (
              <section className="mt-6 flex flex-wrap gap-3">
                {userPost.tags.map(({ tag }) => (
                  <Link
                    href={`/?tag=${tag.title.toLowerCase()}`}
                    key={tag.title}
                    className="rounded-sm border border-hairline px-2.5 py-0.5 font-mono text-xs text-muted transition-colors hover:border-strong hover:text-fg"
                  >
                    {getCamelCaseFromLower(tag.title)}
                  </Link>
                ))}
              </section>
            )}

            <div className="mt-8">
              <InlineAuthorBio
                name={userPost.user.name || "Unknown"}
                username={userPost.user.username || ""}
                image={userPost.user.image}
                bio={userPost.user.bio}
              />
            </div>

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

            <section
              id="discussion"
              className="mt-10 border-t border-hairline pt-8"
            >
              <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-fg">
                Discussion{" "}
                <span className="font-sans font-medium text-faint">
                  {discussionCount}
                </span>
              </h2>
              {userPost.showComments ? (
                <DiscussionArea contentId={userPost.id} noWrapper />
              ) : (
                <div className="py-4">
                  <p className="italic text-muted">
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

  const userArticle = await getUserArticleContent(username, slug);

  if (userArticle && userArticle.user && userArticle.body) {
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

    const discussionCount = await getDiscussionCount(userArticle.id);

    return (
      <>
        <JsonLd data={articleSchema} />
        <JsonLd data={breadcrumbSchema} />

        <div className="mx-auto max-w-3xl px-4 py-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-fg">
              Feed
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/${userArticle.user.username}`}
              className="hover:text-fg"
            >
              {userArticle.user.name}
            </Link>
          </nav>

          <article className="py-2">
            <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <Link
                href={`/${userArticle.user.username}`}
                className="flex items-center gap-2 hover:text-fg"
              >
                {userArticle.user.image ? (
                  <img
                    src={userArticle.user.image}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
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

            {userArticle.tags && userArticle.tags.length > 0 && (
              <section className="mt-6 flex flex-wrap gap-3">
                {userArticle.tags.map(({ tag }) => (
                  <Link
                    href={`/?tag=${tag.title.toLowerCase()}`}
                    key={tag.title}
                    className="rounded-sm border border-hairline px-2.5 py-0.5 font-mono text-xs text-muted transition-colors hover:border-strong hover:text-fg"
                  >
                    {getCamelCaseFromLower(tag.title)}
                  </Link>
                ))}
              </section>
            )}

            <div className="mt-8">
              <InlineAuthorBio
                name={userArticle.user.name || "Unknown"}
                username={userArticle.user.username || ""}
                image={userArticle.user.image}
                bio={userArticle.user.bio}
              />
            </div>

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

            <section
              id="discussion"
              className="mt-10 border-t border-hairline pt-8"
            >
              <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-fg">
                Discussion{" "}
                <span className="font-sans font-medium text-faint">
                  {discussionCount}
                </span>
              </h2>
              {userArticle.showComments ? (
                <DiscussionArea contentId={userArticle.id} noWrapper />
              ) : (
                <div className="py-4">
                  <p className="italic text-muted">
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

  const userLinkPost = await getUserLinkPost(username, slug);

  if (userLinkPost && userLinkPost.user) {
    return <UserLinkDetail username={username} contentSlug={slug} />;
  }

  const feedArticle = await getFeedArticle(username, slug);

  if (feedArticle) {
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

    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <FeedArticleContent sourceSlug={username} articleSlug={slug} />
      </>
    );
  }

  const linkContent = await getLinkContent(username, slug);

  if (linkContent) {
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

    return (
      <>
        <JsonLd data={newsArticleSchema} />
        <JsonLd data={breadcrumbSchema} />
        <LinkContentDetail sourceSlug={username} contentSlug={slug} />
      </>
    );
  }

  return notFound();
};

export default UnifiedPostPage;
