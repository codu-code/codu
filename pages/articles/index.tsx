import type { NextPage } from "next";
import Head from "next/head";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import Layout from "../../components/Layout/Layout";
import { getAllArticlesMetadata } from "../../lib/blog";
import { authors } from "../../config/site_settings";
import { useEffect, useState } from "react";
import { Temporal } from "@js-temporal/polyfill";

const ArticlesPage: NextPage<{ articles: Record<string, any> }> = ({
  articles,
}) => {
  const [sortedarticle,setsortarticle]=useState([]);
  useEffect(()=>{
    const sort = articles.map((obj: { date: Date; }) => {
      var d=obj.date;
      obj.date=new Date(d);
    
      return obj;
    });
    const sortedarticl= sort.sort((a: { date: number; }, b: { date: number; }) => b.date - a.date);
  
    const sortt = sortedarticl.map((obj: { date: any; }) => {
      var d=obj.date;
      var x=d.toISOString().split("T")[0];
      obj.date=x.toString();
      return obj;
    });
    console.log(sortt);
    setsortarticle(sortedarticl);
 
  },[]);
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
              {sortedarticle.map(
                ({
                  slug,
                  title,
                  description,
                  user_id,
                  read_time,
                  date,
                }: any) => (
                  <ArticlePreview
                    key={slug}
                    slug={slug}
                    title={title}
                    description={description}
                    author={authors[user_id]}
                    date={date}
                    readTime={read_time}
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

export const getStaticProps = async () => {
  const metadata = await getAllArticlesMetadata();

  return {
    props: {
      articles: metadata,
    },
  };
};

export default ArticlesPage;
