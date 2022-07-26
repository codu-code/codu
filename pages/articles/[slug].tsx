import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import { getAllArticlePaths, getArticle } from "../../lib/blog";

const ArticlePage: NextPage<{ article: Record<string, any> }> = ({
  article
}) => {
  return (
    <>
      <Head>
        <title>Codú |  {article.frontmatter.title}</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <section className="flex flex-col items-start max-w-3xl mx-auto">
        <h2 className="my-6 sm:my-10 pt-10 text-3xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">{article.frontmatter.title}</h2>
        <article className="max-w-none prose prose-invert" dangerouslySetInnerHTML={{ __html: article.content}}>

        </article>
        </section>
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
        fallback: false
    }
}

export default ArticlePage;
