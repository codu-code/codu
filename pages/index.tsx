import type { NextPage } from "next";
import Image from "next/image";
import { Children, useState } from "react";
import Head from "next/head";
import Layout from "../components/Layout/Layout";
import "atropos/css";
import Atropos from "atropos/react";
import Link from "next/link";
import { trpc } from "../utils/trpc";
import ArticlePreview from "../components/ArticlePreview/ArticlePreview";
import ArticleLoading from "../components/ArticlePreview/ArticleLoading";
import challenge from "public/images/announcements/challenge.png";

import space from "public/images/home/space.jpg";
import rocketman from "public/images/home/rocketman.png";
import moon from "public/images/home/moon.png";

const Home: NextPage = () => {
  const tagsToShow = [
    "JavaScript",
    "Web Development",
    "Tutorial",
    "Productivity",
    "CSS",
    "Terminal",
    "Django",
    "Python",
    "Tips",
  ];

  const { status, data } = trpc.post.randomTrending.useQuery();
  const [rocketLoaded, setRocketLoaded] = useState(false);
  const [moonLoaded, setMoonLoaded] = useState(false);
  const [starsLoaded, setStarsLoaded] = useState(false);

  const isReady = rocketLoaded && moonLoaded && starsLoaded;

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Head>
        <title>Codú - The Web Developer Community</title>
        <meta
          name="description"
          content="A free network and community for web developers. Learn and grow together."
        />
        <meta
          name="keywords"
          content="software development, coding, nodejs, javascript, web development"
        ></meta>
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
          name="og:title"
          content="`Codú - The Web Developer Community"
          key="og:description"
        />
        <meta
          name="og:description"
          content="A free network and community for web developers. Learn and grow together."
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
        <>
          <div>
            <main className="relative">
              <Atropos
                rotateXMax={0.4}
                rotateYMax={0.4}
                stretchX={1}
                stretchY={0.2}
                stretchZ={0.3}
                highlight={false}
                className="h-[calc(100vh_-_100px)] max-h-[calc(100svh_-_100px)] sm:h-[900px] w-full overflow-hidden relative"
              >
                <Image
                  placeholder="blur"
                  className="absolute h-full w-full object-cover -z-10"
                  src={space}
                  data-atropos-offset="-2"
                  alt="Realistic space sky which is black with stars scattered across."
                  onLoad={() => {
                    setStarsLoaded(true);
                  }}
                />

                <div className="absolute -z-10  md:max-h-[800px] md:max-w-[800px] sm:max-h-[800px] sm:max-w-[600px] max-h-[480px] max-w-[480px] left-0 right-0 mx-auto sm:-bottom-60 md:-bottom-96 -bottom-28">
                  <div className="relative mx-auto brightness-75">
                    <Image
                      src={moon}
                      data-atropos-offset="1"
                      alt="Photograph of the moon"
                      sizes="100vw"
                      style={{
                        width: "100%",
                        height: "auto",
                      }}
                      onLoad={() => {
                        setMoonLoaded(true);
                      }}
                    />
                  </div>
                  <div className="absolute h-[240px] w-[240px] md:h-[350px] md:w-[350px] right-0 md:-right-28 top-10">
                    <Image
                      height={350}
                      width={350}
                      src={rocketman}
                      data-atropos-offset="8"
                      alt="3D claymation style model of a astronaut on a rocket"
                      sizes="100vw"
                      style={{
                        width: "100%",
                        height: "auto",
                      }}
                      onLoad={() => {
                        setRocketLoaded(true);
                      }}
                    />
                  </div>
                </div>

                <div
                  data-atropos-offset="0"
                  className="h-full flex flex-col justify-center"
                >
                  <Image
                    width={340}
                    height={200}
                    src="/images/codu.svg"
                    alt="Codú logo"
                    className={`w-[240px] sm:w-[340px] mx-auto object-contain transition duration-500 ${
                      isReady ? "opacity-100" : "opacity-0"
                      }`}
                  />
                  <h1
                    className={`drop-shadow-2xl text-5xl sm:text-7xl font-extrabold tracking-tight text-center text-white mt-8 duration-500 ${
                      isReady ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    A{" "}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
                      space
                    </span>{" "}
                    for coders
                  </h1>
                  <div className="flex justify-center mt-12">
                    <button
                      className="border-2 rounded-full p-4 animate-bounce bg-neutral-900 bg-opacity-60"
                      onClick={() => handleScroll("cta")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="#ffffff"
                        className="w-8 h-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div
                  className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-black"
                  data-atropos-offset="-2"
                />
                <div
                  className="absolute top-0 w-full h-20 bg-gradient-to-b from-black"
                  data-atropos-offset="-2"
                />
              </Atropos>
            </main>
            <section className="bg-white dark:bg-neutral-300 px-2" id="cta">
              <div className="mx-auto lg:max-w-5xl sm:max-w-2xl py-20 sm:py-32">
                <h2 className="text-2xl md:text-left text-center font-semibold tracking-tight text-neutral-900 dark:text-gray-900 sm:text-4xl max-w-[660px]">
                  <span className="font-extrabold">Sign up today</span> to
                  become a writer and get a{" "}
                  <span className="font-extrabold">free</span> invite to our
                  Discord community.
                </h2>
                <div className="mt-8 flex items-center gap-x-6 justify-center md:justify-start">
                  <Link href="/get-started" className="primary-button">
                    Get started
                  </Link>
                  <Link
                    href="/articles/explore-the-benefits-of-being-a-part-of-cod-ety1wehv"
                    className="leading-6 text-neutral-900 dark:text-gray-900 font-semibold"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </section>
            <section></section>
          </div>

          <div className="mx-2">
            <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
              <h1 className="text-3xl tracking-tight font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-4xl ">
                Trending
              </h1>
            </div>
            <div className="lg:grid grid-cols-12 gap-8 mx-auto lg:max-w-5xl sm:max-w-2xl">
              <div className="relative md:col-span-7">
                <section>
                  {status === "error" && (
                    <div className="mt-8">
                      Something went wrong... Please refresh your post.
                    </div>
                  )}
                  {status === "loading" &&
                    Children.toArray(
                      Array.from({ length: 7 }, () => {
                        return <ArticleLoading />;
                      }),
                    )}
                  {status === "success" &&
                    data.map(
                      ({
                        slug,
                        title,
                        excerpt,
                        user: { name, image, username },
                        updatedAt,
                        readTimeMins,
                        id,
                        currentUserLikesPost,
                      }) => (
                        <ArticlePreview
                          key={title}
                          id={id}
                          slug={slug}
                          title={title}
                          excerpt={excerpt}
                          name={name}
                          username={username || ""}
                          image={image}
                          date={updatedAt.toISOString()}
                          readTime={readTimeMins}
                          bookmarkedInitialState={currentUserLikesPost}
                        />
                      ),
                    )}
                </section>
                <div className="flex justify-center">
                  <Link className="secondary-button mt-2" href="/articles">
                    View more articles →
                  </Link>
                </div>
              </div>
              <section className="col-span-5 lg:block hidden">
                <div className="text-neutral-900 dark:text-neutral-50 mt-4 mb-8 border border-neutral-100 dark:border-neutral-600 bg-white dark:bg-neutral-900">
                  <Link href="/articles/join-our-6-week-writing-challenge-quohtgqb">
                    <Image
                      className="w-full"
                      src={challenge}
                      alt={`"Codú Writing Challenge" text on white background`}
                    />
                  </Link>
                  <div className="tracking-wide text-sm my-3 break-words px-4 py-2">
                    <Link
                      className="block underline text-lg leading-6 font-semibold"
                      href="/articles/join-our-6-week-writing-challenge-quohtgqb"
                    >
                      Join the Codú writing challenge!
                    </Link>
                    <p className="my-3">
                      Join our first Codú challenge! Write 6 articles in 6 weeks
                      and earn a swag bag.
                    </p>
                    <p>Click the link to find out more.</p>
                  </div>
                </div>
                <h3 className="text-2xl leading-6 font-semibold tracking-wide mb-4 mt-4">
                  Recommended topics
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {tagsToShow.map((tag) => (
                    <Link
                      key={tag}
                      href={`/articles?tag=${tag.toLowerCase()}`}
                      className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 px-6 py-2 border border-neutral-200 dark:border-neutral-600"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      </Layout>
    </>
  );
};

export default Home;
