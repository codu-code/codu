import React, { Fragment } from "react";
import Markdoc from "@markdoc/markdoc";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import superjson from "superjson";
import { appRouter } from "../../server/trpc/router";
import { getServerAuthSession } from "../../server/common/get-server-auth-session";
import { createContextInner } from "../../server/trpc/context";
import { Menu, Transition } from "@headlessui/react";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";
import { trpc } from "../../utils/trpc";
import { signIn, useSession } from "next-auth/react";

import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";
import {
  HeartIcon,
  BookmarkIcon,
  DotsHorizontalIcon,
} from "@heroicons/react/outline";

const createMenuData = (title: string, username: string, url: string) => [
  {
    label: "Share to Twitter",
    href: `https://twitter.com/intent/tweet?text="${title}", by ${username}&hashtags=coducommunity,codu&url=${url}`,
  },
  {
    label: "Share to LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  },
];

const ArticlePage: NextPage = ({
  slug,
  host,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: session } = useSession();
  if (!slug) return null;

  const { data: post } = trpc.post.bySlug.useQuery({ slug });

  const { data, refetch } = trpc.post.sidebarData.useQuery(
    { id: post?.id || "" },
    { enabled: !!post }
  );

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

  if (!post) return null;

  const optionsData = createMenuData(
    post.title || "",
    post.user.name || "",
    `https://${host}/${post.slug}`
  );

  const ast = Markdoc.parse(post.body);
  const content = Markdoc.transform(ast, config);

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
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${host}/articles/${post.slug}`} />
        <meta
          property="og:image"
          content={encodeURIComponent(
            `http://${host}/api/og?title=${post.title}`
          )}
        />
      </Head>
      <Transition
        show={!!data}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-75"
        enterTo="transform opacity-100 scale-100"
      >
        <div className="bg-smoke border-t-2 border-white fixed lg:w-20 lg:border-r-2 lg:border-b-2 bottom-0 w-full py-2 z-20 lg:rounded-r-lg lg:top-1/2 lg:-translate-y-1/2 lg:h-56 lg:px-2">
          <div className="flex justify-evenly lg:flex-col h-full">
            <div className="flex items-center lg:flex-col">
              <button
                className="p-1 rounded-full hover:bg-neutral-800"
                onClick={() => {
                  if (data?.currentUserLiked) return likePost(post.id, false);
                  likePost(post.id);
                  if (!session) {
                    signIn();
                  }
                }}
              >
                <HeartIcon
                  className={`w-6 h-6${
                    data?.currentUserLiked ? " fill-red-400" : ""
                  }`}
                />
              </button>
              <span className="w-4 ml-2">{data?.likes || 0}</span>
            </div>

            <button
              className="lg:mx-auto p-1 rounded-full hover:bg-neutral-800"
              onClick={() => {
                if (!session) {
                  signIn();
                }
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
            <Menu as="div" className="ml-4 relative">
              <div>
                <Menu.Button className="p-1 rounded-full hover:bg-neutral-800">
                  <span className="sr-only">Open user menu</span>
                  <DotsHorizontalIcon className="w-6 h-6" />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute bottom-14 right-0 lg:left-16 lg:bottom-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                  {optionsData.map((item) => (
                    <Menu.Item key={item.label}>
                      <a
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded"
                        target="blank"
                        rel="noopener noreferrer"
                        href={encodeURI(item.href)}
                      >
                        {item.label}
                      </a>
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </Transition>

      <Layout>
        <div className="border-t-2">
          <section className="mx-auto pb-4 max-w-xl px-4 sm:px-0">
            <h2 className="pt-4 sm:my-5 text-3xl font-bold leading-tight">
              {post.title}
            </h2>

            <article className="prose prose-invert">
              {Markdoc.renderers.react(content, React, {
                components: markdocComponents,
              })}
            </article>
            {post.tags.length > 0 && (
              <section className="flex flex-wrap gap-3">
                {post.tags.map(({ tag }) => (
                  <div
                    key={tag.title}
                    className="bg-gradient-to-r from-orange-400 to-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded-full text-xs font-bold"
                  >
                    {tag.title}
                  </div>
                ))}
              </section>
            )}
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
  const session = await getServerAuthSession(ctx);

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({
      session,
    }),
    transformer: superjson,
  });

  const { params } = ctx;

  if (!params?.slug) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }

  await ssg.post.bySlug.prefetch({ slug: params.slug });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      slug: params.slug,
      host: ctx.req.headers.host || "",
    },
  };
};

export default ArticlePage;
