import React from "react";
import type { RenderableTreeNode } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import Link from "next/link";
import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/core";
import sanitizeHtml from "sanitize-html";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import DiscussionArea from "@/components/Discussion/DiscussionArea";
import { ArticleActionBarWrapper } from "@/components/ArticleActionBar";
import InlineAuthorBio from "@/components/ContentDetail/InlineAuthorBio";
import ArticleAdminPanel from "@/components/ArticleAdminPanel/ArticleAdminPanel";
import NotFound from "@/components/NotFound/NotFound";
import { JsonLd } from "@/components/JsonLd";
import { getCamelCaseFromLower, slugifyTag } from "@/utils/utils";
import { RenderExtensions } from "@/components/editor/editor/extensions/render-extensions";
import { getArticleSchema, getBreadcrumbSchema } from "@/lib/structured-data";
import { db } from "@/server/db";
import { comments } from "@/server/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";
import { type Session } from "next-auth";

// The resolved-post shape shared by the /{username}/{slug} and /d/{slug}
// readers. Mirrors the object returned by getUserPost (author join + tags).
export interface ReaderPost {
  id: string;
  title: string;
  body: string | null;
  status: string;
  publishedAt: string | null;
  published: string | null;
  updatedAt: string | null;
  readTimeMins: number | null;
  slug: string;
  excerpt: string | null;
  canonicalUrl: string | null;
  showComments: boolean;
  upvotes: number | null;
  downvotes: number | null;
  type: string;
  moderationNote: string | null;
  tags: { tag: { title: string; slug?: string | null } }[];
  user: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
    bio: string | null;
  };
}

type ReaderSession = Session | null;

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

// Mirrors discussion.getContentDiscussionCount so the reader renders the same
// "Discussion {N}" heading as the source-content reader.
async function getDiscussionCount(contentId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(comments)
    .where(and(eq(comments.postId, contentId), isNull(comments.deletedAt)));
  return result?.count ?? 0;
}

interface PostReaderProps {
  post: ReaderPost;
  session: ReaderSession;
  host: string;
  /** Canonical absolute path (e.g. /{username}/{slug} or /d/{slug}). Used for
   * the share URL in the action bar. */
  canonicalPath: string;
  /** Discussion-disabled copy varies by surface ("post" vs "article"). */
  commentsDisabledLabel?: string;
  /**
   * Emit this reader's own Article + breadcrumb JSON-LD. The /d/ route emits
   * DiscussionForumPosting itself, so it passes `false` to avoid double schema.
   */
  emitArticleSchema?: boolean;
}

// Shared server component rendering a text post (article/discussion/question/
// til/resource): byline, body (tiptap or markdoc), tags, author bio, action
// bar and the discussion thread. Used by both /{username}/{slug} and /d/{slug}.
const PostReader = async ({
  post,
  session,
  host,
  canonicalPath,
  commentsDisabledLabel = "post",
  emitArticleSchema = true,
}: PostReaderProps) => {
  // Only reachable by the author (the resolver only returns non-published posts
  // when viewerId matches the author's id).
  const isAwaitingReview = post.status === "in_review";
  const isRejected = post.status === "rejected";
  const bodyContent = post.body ?? "";
  const parsedBody = parseJSON(bodyContent);
  const isTiptapContent = parsedBody?.type === "doc";

  // Tiptap branch: sanitized HTML string. Markdoc branch: the transformed tree,
  // rendered to React exactly once at the render site below.
  let renderedContent: string | RenderableTreeNode;

  if (isTiptapContent && parsedBody) {
    renderedContent = renderSanitizedTiptapContent(parsedBody);
  } else {
    const ast = Markdoc.parse(bodyContent);
    renderedContent = Markdoc.transform(ast, config);
  }

  const articleSchema = emitArticleSchema
    ? getArticleSchema({
        title: post.title,
        excerpt: post.excerpt,
        slug: post.slug,
        publishedAt: post.published,
        updatedAt: post.updatedAt,
        readingTime: post.readTimeMins,
        canonicalUrl: post.canonicalUrl,
        tags: post.tags.map((t) => ({ title: t.tag.title })),
        author: {
          name: post.user.name,
          username: post.user.username,
          image: post.user.image,
          bio: post.user.bio,
        },
      })
    : null;

  const breadcrumbSchema = emitArticleSchema
    ? getBreadcrumbSchema([
        { name: "Home", url: "https://www.codu.co" },
        {
          name: post.user.name || "Author",
          url: `https://www.codu.co/${post.user.username}`,
        },
        { name: post.title },
      ])
    : null;

  const discussionCount = await getDiscussionCount(post.id);

  return (
    <>
      {articleSchema && <JsonLd data={articleSchema} />}
      {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}

      <div className="mx-auto max-w-prose py-4 sm:py-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link href="/" className="hover:text-fg">
            Feed
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${post.user.username}`} className="hover:text-fg">
            {post.user.name}
          </Link>
        </nav>

        {isAwaitingReview && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-hairline bg-elevated p-4 text-sm text-muted"
          >
            <p className="font-medium text-fg">Awaiting review</p>
            <p className="mt-1">
              This post is hidden from the feed until a moderator approves it.
            </p>
          </div>
        )}

        {isRejected && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-950"
          >
            <p className="font-medium text-red-700 dark:text-red-300">
              Hidden by moderator
            </p>
            <p className="mt-1 text-red-600 dark:text-red-400">
              This post is not visible to anyone else.
              {post.moderationNote ? ` Reason: ${post.moderationNote}` : ""}
            </p>
          </div>
        )}

        <article className="py-2">
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <Link
              href={`/${post.user.username}`}
              className="flex items-center gap-2 hover:text-fg"
            >
              {post.user.image ? (
                <img
                  src={post.user.image}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {post.user.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="font-medium">{post.user.name}</span>
            </Link>
            {post.published && (
              <>
                <span aria-hidden="true">·</span>
                <time>
                  {new Date(post.published).toLocaleDateString("en-IE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </>
            )}
            {post.readTimeMins && (
              <>
                <span aria-hidden="true">·</span>
                <span>{post.readTimeMins} min read</span>
              </>
            )}
          </div>

          <div className="prose mx-auto max-w-none dark:prose-invert lg:prose-lg">
            {!isTiptapContent && <h1>{post.title}</h1>}

            {isTiptapContent ? (
              renderedContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderedContent as string,
                  }}
                  className="tiptap-content"
                />
              ) : (
                <NotFound />
              )
            ) : (
              <div>
                {Markdoc.renderers.react(renderedContent, React, {
                  components: markdocComponents,
                })}
              </div>
            )}
          </div>

          {post.tags.length > 0 && (
            <section className="mt-6 flex flex-wrap gap-3">
              {post.tags.map(({ tag }) => (
                <Link
                  href={`/tag/${tag.slug || slugifyTag(tag.title)}`}
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
              name={post.user.name || "Unknown"}
              username={post.user.username || ""}
              image={post.user.image}
              bio={post.user.bio}
            />
          </div>

          <div className="mt-8">
            <ArticleActionBarWrapper
              postId={post.id}
              postTitle={post.title}
              postUrl={`https://${host}${canonicalPath}`}
              postUsername={post.user.username || ""}
              initialUpvotes={post.upvotes ?? 0}
              initialDownvotes={post.downvotes ?? 0}
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
            {post.showComments ? (
              <DiscussionArea contentId={post.id} noWrapper />
            ) : (
              <div className="py-4">
                <p className="italic text-muted">
                  Comments are disabled for this {commentsDisabledLabel}
                </p>
              </div>
            )}
          </section>
        </article>
      </div>

      {session && session?.user?.role === "ADMIN" && (
        <ArticleAdminPanel session={session} postId={post.id} />
      )}
    </>
  );
};

export default PostReader;
