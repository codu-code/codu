import React, { Fragment, useEffect, useState } from "react";
import Markdoc from "@markdoc/markdoc";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import Head from "next/head";
import {
  HeartIcon,
  BookmarkIcon,
  DotsHorizontalIcon,
} from "@heroicons/react/outline";
import copy from "copy-to-clipboard";
import prisma from "../../server/db/client";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";
import { trpc } from "../../utils/trpc";
import { signIn, useSession } from "next-auth/react";
import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";
import CommentsArea from "../../components/Comments/CommentsArea";
import { useRouter } from "next/router";

const createMenuData = (title: string, username: string, url: string) => [
  {
    label: "Share to X",
    href: `https://twitter.com/intent/tweet?text="${title}", by ${username}&hashtags=coducommunity,codu&url=${url}`,
  },
  {
    label: "Share to LinkedIn",
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  },
];

interface CopyToClipboardOption {
  label: string;
  href: string;
}

const ArticlePage: NextPage = ({
  slug,
  host,
  post,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: session } = useSession();
  const [copied, setCopied] = useState<boolean>(false);
  const [copyToClipboard, setCopyToClipboard] = useState<CopyToClipboardOption>(
    {
      label: "",
      href: "",
    },
  );

  const { label, href } = copyToClipboard;

  const { push } = useRouter();

  useEffect(() => {
    setCopyToClipboard({
      label: copied ? "Copied!" : "Copy to clipboard",
      href: location.href,
    });
    const to = setTimeout(setCopied, 1000, false);
    return () => clearTimeout(to);
  }, [copied]);

  if (!slug) return null;

  const { data, refetch } = trpc.post.sidebarData.useQuery({
    id: post?.id || "",
  });

  const { mutate: deletePost } = trpc.post.delete.useMutation();

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

  const handleCopyToClipboard = (e: React.FormEvent) => {
    if (label !== e.currentTarget.innerHTML) {
      setCopied(false);
    } else {
      e.preventDefault();
      copy(href);
      setCopied(true);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost({ id: post.id });
        push("/articles");
      } catch {
        console.error("Something went wrong.");
      }
    }
  };

  if (!post) return null;

  const optionsData = createMenuData(
    post.title || "",
    post.user.name || "",
    `https://${host}/articles/${post.slug}`,
  );

  if (label.length > 0) {
    optionsData.push(copyToClipboard);
  }

  const ast = Markdoc.parse(post.body);
  const content = Markdoc.transform(ast, config);

  return (
    <>
      <Head>
        <title>{post.title}</title>
        {post.canonicalUrl && <link rel="canonical" href={post.canonicalUrl} />}
        <meta name="author" content={post.user.name}></meta>
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
        <meta
          property="og:url"
          content={`https://${host}/articles/${post.slug}`}
        />
        <meta
          name="image"
          property="og:image"
          content={`https://${host}/api/og?title=${encodeURIComponent(
            post.title,
          )}`}
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Transition
        show={!!data}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-75"
        enterTo="transform opacity-100 scale-100"
      >
        <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-700 fixed lg:w-20 lg:border-r lg:border-b bottom-0 w-full py-2 z-20 lg:top-1/2 lg:-translate-y-1/2 lg:h-56 lg:px-2">
          <div className="flex justify-evenly lg:flex-col h-full">
            <div className="flex items-center lg:flex-col">
              <button
                className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800"
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
              className="lg:mx-auto p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800"
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
                <Menu.Button className="p-1 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800">
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
                <Menu.Items className="origin-top-right absolute bottom-14 right-0 lg:left-16 lg:bottom-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                  {optionsData.map((item) => (
                    <Menu.Item key={item.label}>
                      <a
                        className="block px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200 rounded"
                        target="blank"
                        rel="noopener noreferrer"
                        href={encodeURI(item.href)}
                        onClick={handleCopyToClipboard}
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
        <>
          <div className="mx-auto pb-4 md:max-w-3xl px-2 sm:px-4 break-words">
            <article className="prose prose-invert lg:prose-lg mx-auto max-w-3xl">
              <h1>{post.title}</h1>
              {Markdoc.renderers.react(content, React, {
                components: markdocComponents,
              })}
            </article>
            {post.tags.length > 0 && (
              <section className="flex flex-wrap gap-3">
                {post.tags.map(({ tag }) => (
                  <Link
                    href={`/articles?tag=${tag.title.toLowerCase()}`}
                    key={tag.title}
                    className="bg-gradient-to-r from-orange-400 to-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded-full text-xs font-bold"
                  >
                    {tag.title}
                  </Link>
                ))}
              </section>
            )}
          </div>
          <div className="mx-auto pb-4 max-w-3xl px-2 sm:px-4">
            <BioBar author={post.user} />
            {post.showComments ? (
              <CommentsArea postId={post.id} postOwnerId={post.userId} />
            ) : (
              <h3 className="py-10 italic text-lg">
                Comments are disabled for this post
              </h3>
            )}
          </div>
        </>
      </Layout>
      {session && session?.user?.role === "ADMIN" && (
        <div className="border-t-2 text-center pb-8">
          <h4 className="text-2xl mb-6 mt-4">Admin Control</h4>
          <button onClick={handleDeletePost} className="secondary-button">
            Delete Post
          </button>
        </div>
      )}
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ slug: string }>,
) => {
  try {
    const { params } = ctx;

    if (!params?.slug) {
      throw new Error("No slug");
    }

    const post = await prisma.post.findUnique({
      where: {
        slug: params.slug,
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
            image: true,
            bio: true,
          },
        },
        tags: {
          select: {
            id: true,
            tag: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!post) throw new Error("Post not found");

    return {
      props: {
        post,
        slug: params.slug,
        host: ctx.req.headers.host || "",
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }
};

export default ArticlePage;
