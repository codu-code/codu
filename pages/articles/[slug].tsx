import React from "react";
import Markdoc from "@markdoc/markdoc";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";
import prisma from "../../server/db/client";
import { trpc } from "../../utils/trpc";

import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";

const ArticlePage: NextPage = ({
  post,
  host,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!post) return null;

  const { data, refetch } = trpc.post.sidebarData.useQuery({ id: post.id });

  const { mutate: like, status: likeStatus } = trpc.post.like.useMutation({
    onSettled() {
      refetch();
    },
  });

  const { mutate: bookmark, status: bookmarkStatus } =
    trpc.post.bookmark.useMutation({
      onSettled() {
        refetch();
      },
    });

  const likePost = async (postId: string, setLiked = true) => {
    if (likeStatus === "loading") return;
    try {
      await like({ postId, setLiked });
    } catch (err) {
      console.error(err);
    }
  };

  const bookmarkPost = async (postId: string, setBookmarked = true) => {
    if (bookmarkStatus === "loading") return;
    try {
      await bookmark({ postId, setBookmarked });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta key="og:title" property="og:title" content={post.title} />
        <meta
          key="og:description"
          property="og:description"
          content={post.excerpt}
        />
        <meta key="description" property="description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${host}/articles/${post.slug}`} />
        <meta
          property="og:image"
          content={`${host}/api/og?title=${post.title}`}
        />
      </Head>
      <div className="bg-black border-t-2 border-white fixed bottom-0 w-full py-2 z-10">
        <div className="flex justify-evenly">
          <div className="flex items-center">
            {data?.currentUserLiked ? (
              <button
                className="p-2 rounded-full hover:bg-neutral-800"
                onClick={() => likePost(post.id, false)}
              >
                <svg
                  className="fill-red-400 w-6 h-6"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </button>
            ) : (
              <button
                className="p-2 rounded-full hover:bg-neutral-800"
                onClick={() => likePost(post.id)}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </button>
            )}
            <span className="w-4 ml-2">{data?.likes}</span>
          </div>
          <div>
            {data?.currentUserBookmarked ? (
              <button
                className="p-2 rounded-full hover:bg-neutral-800"
                onClick={() => bookmarkPost(post.id, false)}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="fill-blue-400 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            ) : (
              <button
                className="p-2 rounded-full hover:bg-neutral-800"
                onClick={() => bookmarkPost(post.id)}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
              </button>
            )}
          </div>
          <div>
            <button
              className="p-2 rounded-full hover:bg-neutral-800"
              onClick={() =>
                console.log("I don't do anything yet... FIX ME PLEASE!")
              }
            >
              <svg
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <Layout>
        <div className="border-t-2">
          <section className="mx-auto pb-4 max-w-xl px-4 sm:px-0">
            <h2 className="pt-4 sm:my-5 text-3xl font-bold leading-tight">
              {post.title}
            </h2>

            {post.tags.length > 0 && (
              <section className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="bg-gradient-to-r from-orange-400 to-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-full text-xs"
                  >
                    {tag.title}
                  </div>
                ))}
              </section>
            )}

            <article className="prose prose-invert">
              {Markdoc.renderers.react(JSON.parse(post.body), React, {
                components: markdocComponents,
              })}
            </article>
          </section>
          <BioBar author={post.user} />
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ slug: string }>
) => {
  const post = await prisma.post.findUnique({
    where: {
      slug: ctx.params?.slug,
    },
    select: {
      id: true,
      title: true,
      body: true,
      excerpt: true,
      slug: true,
      user: {
        select: {
          name: true,
          image: true,
          bio: true,
          username: true,
        },
      },
      tags: true,
    },
  });

  const tags = await prisma.tag.findMany({
    where: {
      id: {
        in: post?.tags.map((tag) => tag.tagId),
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!post) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }

  const host = ctx.req.headers.host || "";

  const ast = Markdoc.parse(post.body);

  const content = Markdoc.transform(ast, config);

  return {
    props: {
      host,
      post: {
        ...post,
        body: JSON.stringify(content),
        tags,
      },
    },
  };
};

export default ArticlePage;
