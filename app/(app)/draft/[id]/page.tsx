import React from "react";
import Markdoc from "@markdoc/markdoc";
import Link from "next/link";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { InlineAuthorBio } from "@/components/ContentDetail";
import { type Metadata } from "next";
import { getPostPreview } from "@/server/lib/posts";
import { getCamelCaseFromLower } from "@/utils/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;

  const post = await getPostPreview({ id });

  if (!post) return {};
  const host = (await headers()).get("host") || "";
  return {
    title: `Draft: ${post.title} | by ${post.user.name} | Codú`,
    authors: {
      name: post.user.name ?? undefined,
      url: `https://www.${host}/${post.user.username}`,
    },
    description: post.excerpt,
    alternates: {
      canonical: post.canonicalUrl,
    },
    robots: "noindex, nofollow",
  };
}

const PreviewPage = async (props: Props) => {
  const params = await props.params;
  const { id } = params;

  const post = await getPostPreview({ id });

  if (!post) {
    notFound();
  }

  const ast = Markdoc.parse(post.body || "");
  const content = Markdoc.transform(ast, config);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <span className="bg-accent/15 rounded-full px-3 py-1 font-medium text-accent">
          Draft Preview
        </span>
      </nav>

      {/* Article card - matches published article layout */}
      <article className="rounded-lg border border-hairline bg-surface p-6">
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
              <div className="bg-accent/15 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-accent">
                {post.user.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <span className="font-medium">{post.user.name}</span>
          </Link>
          {post.readTimeMins && (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.readTimeMins} min read</span>
            </>
          )}
        </div>

        <div className="prose mx-auto max-w-none dark:prose-invert lg:prose-lg">
          <h1>{post.title}</h1>
          {Markdoc.renderers.react(content, React, {
            components: markdocComponents,
          })}
        </div>

        {post.tags.length > 0 && (
          <section className="mt-6 flex flex-wrap gap-3">
            {post.tags.map(({ tag }) => (
              <Link
                href={`/?tag=${tag.title.toLowerCase()}`}
                key={tag.title}
                className="rounded-full bg-gradient-to-r from-accent to-accent px-3 py-1 text-xs font-bold text-on-accent hover:bg-accent"
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
      </article>
    </div>
  );
};

export default PreviewPage;
