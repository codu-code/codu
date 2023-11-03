import Head from "next/head";
import Layout from "@/components/Layout/Layout";
import { CommunityForm } from "@/components/CommunityForm/CommunityForm";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";

const CreateCommunityPage = () => {
  return (
    <>
      <Head>
        <title>{`Codú - View our web developer communities`}</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          property="og:image"
          content="https://codu.co/images/og/home-og.png"
          key="og:image"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://codu.co/communities" />
      </Head>
      <Layout>
        <div className="mx-auto lg:col-span-9 max-w-2xl flex-grow flex flex-col justify-center w-full px-4 sm:px-6">
          <div className="bg-neutral-900 text-neutral-700 shadow-xl">
            <CommunityForm
              defaultValues={{
                name: "",
                city: "",
                country: "",
                coverImage: "",
                description: "",
                excerpt: "",
              }}
            />
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ community: string }>,
) => {
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);

    if (!session) {
      return {
        redirect: {
          destination: "/get-started",
          permanent: false,
        },
      };
    }

    return {
      props: {
        host: ctx.req.headers.host || "",
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }
};

export default CreateCommunityPage;
