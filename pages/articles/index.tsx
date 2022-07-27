import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Card from "../../components/Article/Card";
import Layout from "../../components/Layout/Layout";
import { getAllArticlesMetadata } from "../../lib/blog";

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
        <section className="relative max-w-2xl mx-auto py-4 px-3">
          <h3 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-6xl pb-8 border-b-2">
            Recent Articles
          </h3>
          {articles.map(({ slug, title, description }: any) => (
            <Card
              key={slug}
              slug={slug}
              title={title}
              description={description}
            />
          ))}
        </section>
      </Layout>
    </>
  );
};

export const getStaticProps = async () => {
  const metadata = await getAllArticlesMetadata();

  return {
    props: {
      articles: metadata,
    },
  };
};

export default ArticlesPage;
