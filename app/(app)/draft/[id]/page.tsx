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
      {/* Draft indicator */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <span className="rounded-full bg-pink-100 px-3 py-1 font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
          Draft Preview
        </span>
      </nav>

      {/* Article card - matches published article layout */}
      <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        {/* Author info */}
        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
          <Link
            href={`/${post.user.username}`}
            className="flex items-center gap-2 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            {post.user.image ? (
              <img
                src={post.user.image}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900 dark:text-orange-300">
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

        {/* Article content */}
        <div className="prose mx-auto max-w-none dark:prose-invert lg:prose-lg">
          <h1>{post.title}</h1>
          {Markdoc.renderers.react(content, React, {
            components: markdocComponents,
          })}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <section className="mt-6 flex flex-wrap gap-3">
            {post.tags.map(({ tag }) => (
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
