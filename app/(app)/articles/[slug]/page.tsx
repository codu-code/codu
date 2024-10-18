import React from "react";
import type { RenderableTreeNode } from "@markdoc/markdoc";
import Markdoc from "@markdoc/markdoc";
import Link from "next/link";
import BioBar from "@/components/BioBar/BioBar";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import CommentsArea from "@/components/Comments/CommentsArea";
import ArticleMenu from "@/components/ArticleMenu/ArticleMenu";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import ArticleAdminPanel from "@/components/ArticleAdminPanel/ArticleAdminPanel";
import { type Metadata } from "next";
import { getPost } from "@/server/lib/posts";
import { getCamelCaseFromLower } from "@/utils/utils";
import { generateHTML } from "@tiptap/html";
import { TiptapExtensions } from "@/components/editor/editor/extensions";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug;

  const post = await getPost({ slug });

  // @TODO revisit to give more defaults
  // @TODO can we parse article and give recommended tags?
  const tags = post?.tags.map((tag) => tag.tag.title);

  if (!post) return {};
  const host = headers().get("host") || "";
  return {
    title: `${post.title} | by ${post.user.name} | Codú`,
    authors: {
      name: post.user.name,
      url: `https://www.${host}/${post.user.username}`,
    },
    keywords: tags,
    description: post.excerpt,
    openGraph: {
      description: post.excerpt,
      type: "article",
      images: [
        `/og?title=${encodeURIComponent(
          post.title,
        )}&readTime=${post.readTimeMins}&author=${encodeURIComponent(
          post.user.name,
        )}&date=${post.updatedAt}`,
      ],
      siteName: "Codú",
    },
    twitter: {
      description: post.excerpt,
      images: [`/og?title=${encodeURIComponent(post.title)}`],
    },
    alternates: {
      canonical: post.canonicalUrl,
    },
  };
}

const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

const renderTiptapContent = (jsonContent: JSON) => {
  return generateHTML(jsonContent, [
    ...TiptapExtensions,
  ]);
};

const ArticlePage = async ({ params }: Props) => {
  const session = await getServerAuthSession();
  const { slug } = params;

  const host = headers().get("host") || "";

  const post = await getPost({ slug });

  if (!post) {
    notFound();
  }

  const isTiptapContent = isValidJSON(post.body) &&
    JSON.parse(post.body).type === "doc";

  let renderedContent: string | RenderableTreeNode;

  if (isTiptapContent) {
    const jsonContent = JSON.parse(post.body);
    renderedContent = renderTiptapContent(jsonContent);
  } else {
    const ast = Markdoc.parse(post.body);
    const transformedContent = Markdoc.transform(ast, config);
    renderedContent = Markdoc.renderers.react(transformedContent, React, {
      components: markdocComponents,
    }) as unknown as string;
  }


  return (
    <>
      <ArticleMenu
        session={session}
        postId={post.id}
        postTitle={post.title}
        postUsername={post?.user.username || ""}
        postUrl={`https://${host}/articles/${post.slug}`}
      />
      <div className="mx-auto break-words px-2 pb-4 sm:px-4 md:max-w-3xl">
        <article className="prose mx-auto max-w-3xl dark:prose-invert lg:prose-lg">
          {!isTiptapContent && (<h1>{post.title}</h1>)}

          {isTiptapContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: renderedContent }}
              className="tiptap-content"
            />
          ) : (
            <div>{renderedContent}</div>
          )}
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
        {post.showComments ? (
          <CommentsArea postId={post.id} postOwnerId={post.user.id} />
        ) : (
          <h3 className="py-10 text-lg italic">
            Comments are disabled for this post
          </h3>
        )}
      </div>
      {session && session?.user?.role === "ADMIN" && (
        <ArticleAdminPanel session={session} postId={post.id} />
      )}
    </>
  );
};

export default ArticlePage;
