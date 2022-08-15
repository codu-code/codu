import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import Layout from "../../components/Layout/Layout";
import prisma from "../../server/db/client";

const ArticlesPage = ({
  articles,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <>
      <Head>
        <title>Codú | Articles - View our latest web developer articles</title>
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
                ({
                  slug,
                  title,
                  excerpt,
                  user: { name, image },
                  updatedAt,
                  readTimeMins,
                }) => (
                  <ArticlePreview
                    key={title}
                    slug={slug}
                    title={title}
                    excerpt={excerpt}
                    name={name}
                    image={image}
                    date={updatedAt}
                    readTime={readTimeMins}
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

interface PostsWithStringDates {
  updatedAt: string;
  slug: string;
  title: string;
  excerpt: string;
  readTimeMins: number;
  user: {
    name: string;
    image: string;
  };
}

export const getServerSideProps = async () => {
  const response = await prisma.post.findMany({
    where: { published: true },
    select: {
      title: true,
      body: true,
      updatedAt: true,
      readTimeMins: true,
      slug: true,
      excerpt: true,
      user: {
        select: { name: true, image: true },
      },
    },
  });

  const posts: PostsWithStringDates[] = response.map((post) => {
    return { ...post, updatedAt: post.updatedAt.toISOString() };
  });

  return {
    props: {
      articles: posts,
    },
  };
};

export default ArticlesPage;
