import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { posts, feed_sources } from "@/server/db/schema";
import { getServerAuthSession } from "@/server/auth";
import { Eyebrow } from "@/components/ds";
import { GradientBlinds } from "@/components/marketing/GradientBlinds";

export const metadata: Metadata = {
  title: "Codú — The community for AI builders & indie hackers",
  description:
    "Learn to build with AI, share what you ship, and grow with people doing the same. A free community for AI builders and indie hackers.",
};

async function getRecentFeed() {
  try {
    return await db
      .select({
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        coverImage: posts.coverImage,
        sourceName: feed_sources.name,
        sourceSlug: feed_sources.slug,
      })
      .from(posts)
      .innerJoin(feed_sources, eq(posts.sourceId, feed_sources.id))
      .where(
        and(
          eq(posts.type, "link"),
          eq(posts.status, "published"),
          eq(feed_sources.status, "active"),
        ),
      )
      .orderBy(desc(posts.publishedAt))
      .limit(6);
  } catch {
    return [];
  }
}

const valueProps = [
  {
    k: "01",
    title: "Build with AI",
    body: "Practical tutorials and a curated feed on what's actually working — LLMs, agents, the tools worth your time.",
  },
  {
    k: "02",
    title: "Ship in public",
    body: "Share what you're building, get real feedback, and keep momentum with people on the same path.",
  },
  {
    k: "03",
    title: "Grow your craft",
    body: "Write, get read, and level up — from first project to shipping real products with AI.",
  },
  {
    k: "04",
    title: "Find your next role",
    body: "An AI-developer job board for builders who want to get paid to work with AI.",
  },
];

export default async function HomePage() {
  // Members get their feed as home; the marketing landing is for logged-out + SEO.
  const session = await getServerAuthSession();
  if (session) redirect("/feed");

  const feed = await getRecentFeed();

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b border-hairline">
        <GradientBlinds
          className="opacity-60"
          gradientColors={["#0a0b0e", "#134e48", "#2dd4bf"]}
          angle={20}
          noise={0.1}
          blindCount={10}
          blindMinWidth={90}
          spotlightRadius={0.6}
          spotlightSoftness={1.2}
          spotlightOpacity={0.5}
          mouseDampening={0.15}
          mixBlendMode="screen"
        />
        {/* readability scrim */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-canvas/50 via-canvas/20 to-canvas"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center sm:px-8 sm:py-36">
          <div className="motion-safe:animate-rise [animation-delay:0ms]">
            <Eyebrow className="!text-center">learn · build · ship · grow</Eyebrow>
          </div>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-fg motion-safe:animate-rise [animation-delay:90ms] sm:text-7xl">
            The community for{" "}
            <span className="text-accent">AI builders</span> &amp; indie hackers
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted motion-safe:animate-rise [animation-delay:180ms] sm:text-xl">
            Learn to build with AI, share what you ship, and grow with people doing
            the same.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 motion-safe:animate-rise [animation-delay:270ms]">
            <Link href="/get-started" className="primary-button px-7 py-3 text-base">
              Join free
            </Link>
            <Link
              href="/feed"
              className="font-mono text-sm font-semibold text-fg transition-colors hover:text-accent"
            >
              Browse the feed ›
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Feed preview (proof of life) ───────── */}
      {feed.length > 0 && (
        <section className="border-t border-hairline bg-surface/40">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Eyebrow>what builders are reading</Eyebrow>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                  Fresh from the feed
                </h2>
              </div>
              <Link
                href="/feed"
                className="hidden whitespace-nowrap font-mono text-sm font-semibold text-accent hover:underline sm:block"
              >
                See all ›
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {feed.map((p) => (
                <Link
                  key={`${p.sourceSlug}-${p.slug}`}
                  href={`/${p.sourceSlug}/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-colors duration-200 hover:border-accent/50"
                >
                  {/* Preview image (CSS bg — external domains aren't allowed by next/image) */}
                  <div className="overflow-hidden">
                    {p.coverImage ? (
                      <div
                        className="aspect-[16/9] bg-elevated bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{ backgroundImage: `url("${p.coverImage}")` }}
                      />
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-elevated bg-grid-dots bg-[length:18px_18px] transition-transform duration-500 ease-out group-hover:scale-105">
                        <span className="px-4 text-center font-display text-lg font-bold text-faint">
                          {p.sourceName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <span className="font-mono text-xs text-faint">
                      {p.sourceName}
                    </span>
                    <h3 className="mt-2 font-display text-base font-bold leading-snug text-fg group-hover:text-accent">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-semibold text-accent">
                      Read
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        ›
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── What you get ───────── */}
      <section className="border-t border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Eyebrow>why codú</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Everything you need to build and ship with AI — in one place.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2">
            {valueProps.map((v) => (
              <div key={v.k} className="bg-canvas p-8">
                <span className="font-mono text-sm text-accent">{v.k}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-fg">
                  {v.title}
                </h3>
                <p className="mt-2 text-muted">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Community beat ───────── */}
      <section className="border-t border-hairline bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Eyebrow>the community</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Build in public with people who get it.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Share what you&apos;re building, get real feedback, and swap what&apos;s
            actually working with AI — free, in our Discord and on your profile.
          </p>
          <div className="mt-8">
            <Link href="/get-started" className="primary-button px-7 py-3 text-base">
              Join free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
