import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
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
        <section className="relative">
        {articles.map((article: any) => {
          return <h1><Link href={`/articles/${article.slug}`}>{article.title}</Link></h1>;
        })}
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
