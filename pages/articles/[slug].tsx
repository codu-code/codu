import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";

import { getAllArticlePaths, getArticle } from "../../lib/blog";

const ArticlePage: NextPage<{ article: Record<string, any> }> = ({
  article,
}) => {
  return (
    <>
      <Head>
        <title>Codú | {article.frontmatter.title}</title>
      </Head>
      <Layout>
        <>
          <section className="mx-auto px-4 max-w-xl">
            <h2 className="my-6 sm:my-5 pt-5 text-3xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
              {article.frontmatter.title}
            </h2>
            <article
              className="prose prose-invert"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </section>
          <BioBar userId={article.frontmatter.userId} />
        </>
      </Layout>
    </>
  );
};

export const getStaticProps = async (ctx: any) => {
  const article = await getArticle(ctx.params.slug);

  return {
    props: {
      article,
    },
  };
};

export const getStaticPaths = async () => {
  const paths = await getAllArticlePaths();

  return {
    paths,
    fallback: false,
  };
};

export default ArticlePage;
