import Image from "next/image";
import Link from "next/link";
import challenge from "public/images/announcements/challenge.png";
import Hero from "@/components/Hero/Hero";
import TrendingPostsHome from "@/components/TrendingPostsHome/TrendingPostsHome";
import SideBarSavedPosts from "@/components/SideBar/SideBarSavedPosts";
import { getServerAuthSession } from "@/server/auth";

const Home = async () => {
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

  const session = await getServerAuthSession();

  return (
    <>
      <div>
        <Hero />
        <section className="bg-white px-2 dark:bg-neutral-300" id="cta">
          <div className="mx-auto py-20 sm:max-w-2xl sm:py-32 lg:max-w-5xl">
            <h2 className="max-w-[660px] text-center text-2xl font-semibold tracking-tight text-neutral-900 dark:text-gray-900 sm:text-4xl md:text-left">
              <span className="font-extrabold">Sign up today</span> to become a
              writer and get a <span className="font-extrabold">free</span>{" "}
              invite to our Discord community.
            </h2>
            <div className="mt-8 flex items-center justify-center gap-x-6 md:justify-start">
              <Link href="/get-started" className="primary-button">
                Get started
              </Link>
              <Link
                href="/articles/explore-the-benefits-of-being-a-part-of-cod-ety1wehv"
                className="font-semibold leading-6 text-neutral-900 dark:text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mx-2">
        <div className="mt-8 flex max-w-5xl items-center justify-between border-b pb-4 sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl ">
            Trending
          </h1>
        </div>
        <div className="mx-auto grid-cols-12 gap-8 sm:max-w-2xl lg:grid lg:max-w-5xl">
          <TrendingPostsHome />
          <section className="col-span-5 hidden lg:block">
            <div className="mb-8 mt-4 border border-neutral-300 bg-white text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50">
              <Link href="/articles/join-our-6-week-writing-challenge-quohtgqb">
                <Image
                  className="w-full"
                  src={challenge}
                  alt={`"Codú Writing Challenge" text on white background`}
                />
              </Link>
              <div className="my-3 break-words px-4 py-2 text-sm tracking-wide">
                <Link
                  className="block text-lg font-semibold leading-6 underline"
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
            <h3 className="mb-4 mt-4 text-2xl font-semibold leading-6 tracking-wide">
              Recommended topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tagsToShow.map((tag) => (
                <Link
                  key={tag}
                  href={`/articles?tag=${tag.toLowerCase()}`}
                  className="border border-neutral-300 bg-white px-6 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
                >
                  {tag}
                </Link>
              ))}
            </div>
            {session && (
              <div className="flex flex-wrap gap-2">
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
