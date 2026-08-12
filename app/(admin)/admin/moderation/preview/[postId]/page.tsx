import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { posts, user, post_tags, tag } from "@/server/db/schema";
import { PostBody, renderPostBody } from "@/components/ContentDetail/PostBody";
import { getCamelCaseFromLower } from "@/utils/utils";
import { safeExternalHref } from "@/utils/url";

export const metadata = {
  title: "Preview - Codú Admin",
  description: "Read a submission before approving or declining it",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ postId: string }> };

// Read-only preview of a submission, for deciding whether it belongs on the
// site. It deliberately lives inside `(admin)` rather than exposing unpublished
// posts on the public reader routes: moderators need to READ a post, not vote,
// bookmark or comment on one that may be about to be rejected — and admins
// should still see the public site exactly as readers do.
//
// The body renders through the same `PostBody` the reader uses, so what a
// moderator approves is what readers will get.
//
// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default async function Page({ params }: Props) {
  const { postId } = await params;

  const [record] = await db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      excerpt: posts.excerpt,
      type: posts.type,
      status: posts.status,
      slug: posts.slug,
      externalUrl: posts.externalUrl,
      coverImage: posts.coverImage,
      readingTime: posts.readingTime,
      createdAt: posts.createdAt,
      moderationNote: posts.moderationNote,
      authorName: user.name,
      authorUsername: user.username,
    })
    .from(posts)
    .leftJoin(user, eq(posts.authorId, user.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (!record) notFound();

  const renderedBody = renderPostBody(record.body);
  const externalHref = safeExternalHref(record.externalUrl);

  const tags = await db
    .select({ title: tag.title, slug: tag.slug })
    .from(post_tags)
    .innerJoin(tag, eq(post_tags.tagId, tag.id))
    .where(eq(post_tags.postId, record.id));

  return (
    <div className="mx-auto max-w-3xl px-0 py-4 sm:px-4 sm:py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/moderation"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-fg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="eyebrow">
            <span className="slash">{"// "}</span>preview
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-fg">
            {record.title || "Untitled"}
          </h1>
          <p className="mt-1 font-mono text-xs text-faint">
            {record.type} · {record.status} · @
            {record.authorUsername ?? "unknown"}
            {record.readingTime ? ` · ${record.readingTime} min read` : ""}
          </p>
        </div>
      </div>

      {record.moderationNote && (
        <p className="mb-6 rounded-lg border border-hairline bg-inset p-3 text-sm text-muted">
          <span className="font-medium text-fg">Flagged:</span>{" "}
          {record.moderationNote}
        </p>
      )}

      {record.excerpt && (
        <p className="mb-6 text-base text-muted">{record.excerpt}</p>
      )}

      {/* A link submission is judged on both halves: the member's own framing
          above, and the destination. rel/noreferrer keep the admin surface out
          of the referrer of a page that is under review precisely because it
          may be hostile. */}
      {record.type === "link" &&
        (externalHref ? (
          <p className="mb-6 break-all font-mono text-sm">
            <span className="text-faint">{"// destination "}</span>
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent underline"
            >
              {externalHref}
            </a>
          </p>
        ) : (
          <p className="mb-6 font-mono text-sm text-danger">
            {"// destination missing or not a http(s) URL: "}
            {record.externalUrl ?? "none"}
          </p>
        ))}

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.title}
              className="rounded-sm border border-hairline px-2.5 py-0.5 font-mono text-xs text-muted"
            >
              {getCamelCaseFromLower(t.title)}
            </span>
          ))}
        </div>
      )}

      {record.body ? (
        <article className="prose max-w-none dark:prose-invert">
          <PostBody {...renderedBody} />
        </article>
      ) : (
        <p className="font-mono text-sm text-faint">{"// no body submitted"}</p>
      )}

      <p className="mt-8 font-mono text-xs text-faint">
        {"// read-only — approve or decline from the queue"}
      </p>
    </div>
  );
}
