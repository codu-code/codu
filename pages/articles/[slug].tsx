import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import BioBar from "../../components/BioBar/BioBar";

import { getAllArticlePaths, getArticle } from "../../lib/blog";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypePrism from "rehype-prism";

const ArticlePage: NextPage<{
  article: { content: string; frontmatter: any };
}> = ({ article }) => {
  return (
    <>
      <Head>
        <title>Codú | {article.frontmatter.title}</title>
      </Head>
      <Layout>
        <div className="border-t-2">
          <section className="mx-auto pb-4 max-w-xl px-4 sm:px-0">
            <h2 className="pt-4 sm:my-5 text-3xl font-bold leading-tight">
              {article.frontmatter.title}
            </h2>
            <article className="prose prose-invert">
              <ReactMarkdown
                rehypePlugins={[rehypePrism]}
              >
                {article.content}
              </ReactMarkdown>
            </article>
          </section>
          <BioBar userId={article.frontmatter.user_id} />
        </div>
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
