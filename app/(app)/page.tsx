import { Suspense } from "react";
import Link from "next/link";
import Hero from "@/components/Hero/Hero";
import TrendingPosts from "@/components/TrendingPosts/TrendingPosts";
import TrendingLoading from "@/components/TrendingPosts/TrendingPostsLoading";
import SideBarSavedPosts from "@/components/SideBar/SideBarSavedPosts";
import { getServerAuthSession } from "@/server/auth";
import PopularTags from "@/components/PopularTags/PopularTags";
import PopularTagsLoading from "@/components/PopularTags/PopularTagsLoading";
import { NewsletterCapture, Eyebrow } from "@/components/ds";
import { JsonLd } from "@/components/JsonLd";
import { getWebSiteSchema } from "@/lib/structured-data";

const Home = async () => {
  const session = await getServerAuthSession();

  return (
    <>
      {/* WebSite JSON-LD for homepage SEO and sitelinks search box */}
      <JsonLd data={getWebSiteSchema()} />

      {!session && (
        <div>
          <Hero />
          <section className="border-b border-hairline bg-surface px-4" id="cta">
            <div className="mx-auto max-w-5xl py-20 sm:py-24">
              <Eyebrow>the community</Eyebrow>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                Build in public with people who get it.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-muted">
                Share what you&apos;re building, get real feedback, and swap what&apos;s
                actually working with AI — free, in our Discord and on your profile.
              </p>
              <div className="mt-8">
                <Link
                  href="/get-started"
                  className="primary-button px-6 py-3 text-base"
                >
                  Join free
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="mx-2" id={session ? "cta" : ""}>
        <div className="mt-6 flex max-w-5xl items-center justify-between sm:mx-auto sm:max-w-2xl lg:max-w-5xl">
          <h3 className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-50">
            Trending
          </h3>
        </div>
        <div className="mx-auto grid-cols-12 gap-6 sm:max-w-2xl lg:grid lg:max-w-5xl">
          <Suspense fallback={<TrendingLoading />}>
            <TrendingPosts session={session} />
          </Suspense>
          <section className="col-span-5 hidden lg:block">
            <div className="sticky top-20">
              <NewsletterCapture variant="compact" />
              <h4 className="mb-4 mt-4 text-2xl font-semibold leading-6 tracking-wide">
                Popular topics
              </h4>
              <div className="flex flex-wrap gap-2">
                <Suspense fallback={<PopularTagsLoading />}>
                  <PopularTags />
                </Suspense>
              </div>
              {session && (
                <div className="flex flex-wrap gap-2">
                  <SideBarSavedPosts />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Home;
