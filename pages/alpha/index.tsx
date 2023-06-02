import type { Nextpost } from "next";
import Image from "next/image";
import { Children, Fragment, useEffect } from "react";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import "atropos/css";
import Atropos from "atropos/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useInView } from "react-intersection-observer";
import { trpc } from "../../utils/trpc";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";
import challenge from "../../public/images/announcements/challenge.png";

const Home: Nextpost = () => {
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

  console.log({ data });

  return (
    <>
      <Head>
        <title>Codú | Homepost</title>
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
        <>
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
                <Image
                  height={2400}
                  width={1600}
                  className="absolute h-full w-full object-cover -z-10"
                  src={"/images/home/space.jpg"}
                  data-atropos-offset="-2"
                  alt="Realistic space sky which is black with stars scattered across."
                />
                <div data-atropos-offset="0" className="mt-60">
                  <Image
                    width={340}
                    height={200}
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
                  <Image
                    height={800}
                    width={800}
                    className="mt-8 md:mt-20 mx-auto brightness-75"
                    src={"/images/home/moon.png"}
                    data-atropos-offset="1"
                    alt="Photograph of the moon"
                  />
                  <Image
                    height={350}
                    width={350}
                    className="h-[280px] w-[280px] md:h-[350px] md:w-[350px] absolute right-0 md:-right-28 top-8"
                    src={"/images/home/rocketman.png"}
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
            <section className="bg-neutral-300">
              <div className="mx-auto max-w-7xl px-6 py-20 sm:py-32 lg:px-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Sign up today to become a writer and
                  <br />
                  get a free invite to our Discord community.
                </h2>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link href="/get-started" className="primary-button">
                    Get started
                  </Link>
                  <a href="#" className="leading-6 text-gray-900 font-semibold">
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </section>
            <section></section>
          </div>

          <div className="mx-2">
            <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
              <h1 className="text-3xl tracking-tight font-extrabold text-neutral-50 sm:text-4xl ">
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
                      })
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
                      )
                    )}
                </section>
                <div className="flex justify-center">
                  <Link className="secondary-button mt-2" href="/articles">
                    View more articles →
                  </Link>
                </div>
              </div>
              <section className="col-span-5 lg:block hidden">
                <div className="mt-4 mb-8 border border-neutral-600 bg-neutral-900">
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
                      className="bg-neutral-900 text-neutral-50 px-6 py-2 border border-neutral-600"
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
