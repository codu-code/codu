import type {
  Comment,
  DiscussionForumPosting,
  InteractionCounter,
  WithContext,
} from "../types";
import { getPersonRef } from "./person";

import { SITE_ORIGIN as BASE_URL } from "@/config/site";

interface ForumCommentInput {
  id: string;
  body: string | null;
  createdAt: string | null;
  author: {
    name: string | null;
    username: string | null;
  };
}

interface DiscussionForumPostingInput {
  title: string;
  /** Raw OP body (HTML / markdoc / tiptap-json). Stripped to plain text. */
  body?: string | null;
  /** Pre-computed plain-text excerpt, used as the fallback when body strips empty. */
  excerpt?: string | null;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  upvotes?: number | null;
  author: {
    name: string | null;
    username: string | null;
    image?: string | null;
    bio?: string | null;
  };
  comments: ForumCommentInput[];
}

/**
 * Best-effort plain-text extraction for schema `text` fields.
 * Strips HTML tags and collapses whitespace. Pure (no DOM / deps) so the
 * builder stays client-safe. tiptap JSON bodies won't strip cleanly, so the
 * caller should pass an `excerpt` fallback for those.
 */
function toPlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate DiscussionForumPosting schema for a Codú discussion/question.
 * The visible comment list is client-rendered, so the comments are passed in
 * from a server query to surface them to crawlers via `comment[]`.
 */
export function getDiscussionForumPostingSchema(
  input: DiscussionForumPostingInput,
): WithContext<DiscussionForumPosting> {
  const mainEntityOfPage = `${BASE_URL}/d/${input.slug}`;

  const strippedBody = input.body ? toPlainText(input.body) : "";
  const text = strippedBody || input.excerpt || input.title;

  const datePublished =
    input.publishedAt || input.updatedAt || new Date().toISOString();

  const interactionStatistic: InteractionCounter[] = [
    {
      "@type": "InteractionCounter",
      interactionType: { "@type": "CommentAction" },
      userInteractionCount: input.comments.length,
    },
    {
      "@type": "InteractionCounter",
      interactionType: { "@type": "LikeAction" },
      userInteractionCount: input.upvotes ?? 0,
    },
  ];

  const comment: Comment[] = input.comments.map((c) => ({
    "@type": "Comment" as const,
    text: c.body ? toPlainText(c.body) : "",
    dateCreated: c.createdAt || datePublished,
    author: getPersonRef({
      name: c.author.name,
      username: c.author.username,
    }),
    url: `${mainEntityOfPage}#comment-${c.id}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: input.title,
    ...(text && { text }),
    datePublished,
    ...(input.updatedAt && { dateModified: input.updatedAt }),
    author: getPersonRef({
      name: input.author.name,
      username: input.author.username,
      image: input.author.image,
      bio: input.author.bio,
    }),
    mainEntityOfPage,
    interactionStatistic,
    comment,
  };
}
