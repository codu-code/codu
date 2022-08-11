import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import Layout from "../../components/Layout/Layout";
import { getAllArticlesMetadata } from "../../lib/blog";
import { serialize } from "superjson";
import { authors } from "../../config/site_settings";
import prisma from "../../server/db/client";


const ArticlesPage: NextPage<{ articles: Record<string, any> }> = ({
  articles,
}) => {
  return (
    <>
      <Head>
        <title>Codú | Blog</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <div className="border-t-2 border-white">
          <div className="relative sm:mx-auto max-w-2xl mx-4">
            <h1 className="text-3xl tracking-tight font-extrabold text-gray-50 sm:text-4xl my-8">
              Articles
            </h1>
            <section>
              {articles.map(
                ({ slug, title, description, user, createdAt }: any) => (
                  <ArticlePreview
                    key={title}
                    slug={slug}
                    title={title}
                    description={description}
                    author={user}
                    date={createdAt}
                    readTime={"3 mins"}
                  />
                )
              )}
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const response = await prisma.post.findMany({
    where: { published: true },
    select: {
      title: true,
      body: true,
      createdAt: true,
      slug: true,
      user: {
        select: { name: true, image: true },
      },
    },
  });

  const { json } = serialize(response);

  return {
    props: {
      articles: json,
    },
  };
};

export default ArticlesPage;
