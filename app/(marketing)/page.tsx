import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { posts, feed_sources } from "@/server/db/schema";
import { Eyebrow } from "@/components/ds";

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
  const feed = await getRecentFeed();

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-[-10%] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-28 text-center sm:px-8 sm:py-36">
          <Eyebrow className="!text-center">learn · build · ship · grow</Eyebrow>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.98] tracking-tight text-fg sm:text-7xl">
            The community for{" "}
            <span className="text-accent">AI builders</span> &amp; indie hackers
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted sm:text-xl">
            Learn to build with AI, share what you ship, and grow with people doing
            the same.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
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
            <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
              {feed.map((p) => (
                <Link
                  key={`${p.sourceSlug}-${p.slug}`}
                  href={`/${p.sourceSlug}/${p.slug}`}
                  className="group flex flex-col bg-canvas p-6 transition-colors hover:bg-surface"
                >
                  <span className="font-mono text-xs text-faint">
                    {p.sourceName}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug text-fg group-hover:text-accent">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {p.excerpt}
                    </p>
                  )}
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
