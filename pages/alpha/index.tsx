import type { NextPage } from "next";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import "atropos/css";
import Atropos from "atropos/react";
import space from "../../public/home/space.jpg";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Codú | Homepage</title>
        <meta name="description" content="Codú | Web Developer Community" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          name="og:description"
          content={`Codú is the ultimate community for web developers.`}
          key="og:description"
        />
        <meta
          property="og:image"
          content="/images/og/home-og.png"
          key="og:image"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://codu.co" />
      </Head>
      <Layout>
        <div>
          <main className="relative">
            <Atropos
              rotateXMax={0.2}
              rotateYMax={0.2}
              stretchX={1}
              stretchY={0.2}
              stretchZ={0.2}
              highlight={false}
              className="h-[770px] sm:h-[1000px] w-ful overflow-hidden relative"
            >
              <img
                className="absolute h-full w-full object-cover -z-10"
                src={"images/home/space.jpg"}
                data-atropos-offset="-2"
                alt="Realistic space sky which is black with stars scattered across."
              />
              <div data-atropos-offset="0" className="mt-60">
                <img
                  src="/images/codu.svg"
                  className="w-[240px] sm:w-[340px] mx-auto object-contain"
                  alt="Codú logo"
                />
                <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-center text-white mt-8">
                  A{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
                    space
                  </span>{" "}
                  for coders
                </h1>
              </div>
              <div className="relative md:h-[800px] md:w-[800px] mx-auto">
                <img
                  className="mt-8 md:mt-20 mx-auto brightness-75"
                  src={"images/home/moon.png"}
                  data-atropos-offset="1"
                  alt="Photograph of the moon"
                />
                <img
                  className="h-[280px] w-[280px] md:h-[350px] md:w-[350px] absolute right-0 md:-right-28 top-8"
                  src={"images/home/rocketman.png"}
                  data-atropos-offset="8"
                  alt="3D claymation style model of a astronaut on a rocket"
                />
              </div>
              <div
                className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-black"
                data-atropos-offset="-2"
              />
              <div
                className="absolute top-0 w-full h-40 bg-gradient-to-b from-black"
                data-atropos-offset="-2"
              />
            </Atropos>
          </main>
          <div className="pt-10 sm:pt-16 lg:pt-8 pb-14 px-4 sm:px-6 lg:px-8 lg:max-w-6xl lg:mx-auto"></div>
        </div>
      </Layout>
    </>
  );
};

export default Home;
