import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../../../components/Layout/Layout";

const Courses: NextPage = () => {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <Layout>
        <div className="mx-2">
          <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
            <h1 className="text-3xl tracking-tight font-extrabold text-neutral-50 sm:text-4xl ">
              Courses
            </h1>
          </div>
        </div>
      </Layout>
    </>
  );
}

export default Courses
