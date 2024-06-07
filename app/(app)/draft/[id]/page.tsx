import React from "react";
import Markdoc from "@markdoc/markdoc";
import Link from "next/link";
import BioBar from "@/components/BioBar/BioBar";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { type Metadata } from "next";
import { getPostPreview } from "@/server/lib/posts";
import { getCamelCaseFromLower } from "@/utils/utils";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;

  const post = await getPostPreview({ id });

  if (!post) return {};
  const host = headers().get("host") || "";
  return {
    title: `Previewing ${post.title} | by ${post.user.name} | Codú`,
    authors: {
      name: post.user.name,
      url: `https://www.${host}/${post.user.username}`,
    },
    description: post.excerpt,
    alternates: {
      canonical: post.canonicalUrl,
    },
    robots: "noindex, nofollow",
  };
}

const PreviewPage = async ({ params }: Props) => {
  console.log("xxx", { params });
  const { id } = params;

  const post = await getPostPreview({ id });

  if (!post) {
    notFound();
  }

  const ast = Markdoc.parse(post.body);
  const content = Markdoc.transform(ast, config);

  return (
    <>
      <div className="mx-auto break-words px-2 pb-4 sm:px-4 md:max-w-3xl">
        <article className="prose mx-auto max-w-3xl dark:prose-invert lg:prose-lg">
          <h1>{post.title}</h1>
          {Markdoc.renderers.react(content, React, {
            components: markdocComponents,
          })}
        </article>
        {post.tags.length > 0 && (
          <section className="flex flex-wrap gap-3">
            {post.tags.map(({ tag }) => (
              <Link
                // only reason this is toLowerCase is to make url look nicer. Not needed for functionality
                href={`/articles?tag=${tag.title.toLowerCase()}`}
                key={tag.title}
                className="rounded-full bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700"
              >
                {getCamelCaseFromLower(tag.title)}
              </Link>
            ))}
          </section>
        )}
      </div>
      <div className="mx-auto max-w-3xl px-2 pb-4 sm:px-4">
        <BioBar author={post.user} />
      </div>
    </>
  );
};

export default PreviewPage;
