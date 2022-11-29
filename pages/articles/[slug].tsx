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
import {
  HeartIcon,
  BookmarkIcon,
  DotsHorizontalIcon,
} from "@heroicons/react/outline";

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
            <button
              className="p-2 rounded-full hover:bg-neutral-800"
              onClick={() => {
                if (data?.currentUserLiked) return likePost(post.id, false);
                likePost(post.id);
              }}
            >
              <HeartIcon
                className={`w-6 h-6${
                  data?.currentUserLiked ? " fill-red-400" : ""
                }`}
              />
            </button>
            <span className="w-4 ml-2">{data?.likes}</span>
          </div>
          <div>
            <button
              className="p-2 rounded-full hover:bg-neutral-800"
              onClick={() => {
                if (data?.currentUserBookmarked)
                  return bookmarkPost(post.id, false);
                bookmarkPost(post.id);
              }}
            >
              <BookmarkIcon
                className={`w-6 h-6${
                  data?.currentUserBookmarked ? " fill-blue-400" : ""
                }`}
              />
            </button>
          </div>
          <div>
            <button
              className="p-2 rounded-full hover:bg-neutral-800"
              onClick={() =>
                console.log("I don't do anything yet... FIX ME PLEASE!")
              }
            >
              <DotsHorizontalIcon className="w-6 h-6" />
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
