import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";
import prisma from "../../server/db/client";

import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypePrism from "rehype-prism";

const ArticlePage: NextPage = ({
  post,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!post) return null;

  return (
    <>
      <Head>
        <title>Codú | {post.title}</title>
        <meta key="og:title" property="og:title" content={post.title} />
        <meta
          key="og:description"
          property="og:description"
          content={post.excerpt}
        />
        <meta key="description" property="description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://codu.co/articles" />
      </Head>
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
              <ReactMarkdown rehypePlugins={[rehypePrism]}>
                {post.body}
              </ReactMarkdown>
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

  return {
    props: {
      post: {
        ...post,
        tags,
      },
    },
  };
};

export default ArticlePage;
