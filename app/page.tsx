"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import Link from "next/link";
import challenge from "public/images/announcements/challenge.png";
import Hero from "@/components/Hero/Hero";
import TrendingPostsHome from "@/components/TrendingPostsHome/TrendingPostsHome";
import SideBarSavedPosts from "@/components/SideBar/SideBarSavedPosts";

const Home = () => {
  const { data: session } = useSession();

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

  return (
    <>
      <div>
        <Hero />
        <section className="bg-white dark:bg-neutral-300 px-2" id="cta">
          <div className="mx-auto lg:max-w-5xl sm:max-w-2xl py-20 sm:py-32">
            <h2 className="text-2xl md:text-left text-center font-semibold tracking-tight text-neutral-900 dark:text-gray-900 sm:text-4xl max-w-[660px]">
              <span className="font-extrabold">Sign up today</span> to become a
              writer and get a <span className="font-extrabold">free</span>{" "}
              invite to our Discord community.
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
      </div>

      <div className="mx-2">
        <div className="max-w-5xl sm:mx-auto mt-8 border-b pb-4 flex justify-between items-center lg:max-w-5xl sm:max-w-2xl">
          <h1 className="text-3xl tracking-tight font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-4xl ">
            Trending
          </h1>
        </div>
        <div className="lg:grid grid-cols-12 gap-8 mx-auto lg:max-w-5xl sm:max-w-2xl">
          <TrendingPostsHome />
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
                  Join our first Codú challenge! Write 6 articles in 6 weeks and
                  earn a swag bag.
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
            {session && (
              <div className="flex gap-2 flex-wrap">
                <SideBarSavedPosts />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Home;
