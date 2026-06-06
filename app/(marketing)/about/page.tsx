import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ds";
import { twitterUrl, linkedinUrl, discordInviteUrl } from "@/config/site_settings";

export const metadata: Metadata = {
  title: "About Codú — The community for AI builders & indie hackers",
  description:
    "Codú is the community for AI builders and indie hackers. Learn to build with AI, share what you ship, and grow with people doing the same.",
  openGraph: {
    title: "About Codú — The community for AI builders & indie hackers",
    description:
      "Learn to build with AI, share what you ship, and grow with people doing the same. Free to join.",
    images: "/images/og/home-og.png",
  },
};

const whatYouGet = [
  {
    title: "Tutorials & articles",
    body: "Practical, hands-on writing from builders — how to actually build and ship with AI.",
    href: "/articles",
  },
  {
    title: "A curated feed",
    body: "The signal, not the noise. What's worth reading this week for people building with AI.",
    href: "/feed",
  },
  {
    title: "Codú Weekly",
    body: "What to build with AI this week, in 5 minutes. Free, every Tuesday.",
    href: "https://newsletter.codu.co/",
    external: true,
  },
  {
    title: "A community that ships",
    body: "Share what you're building, get feedback, and grow with people doing the same. Free on Discord.",
    href: discordInviteUrl,
    external: true,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-28">
          <Eyebrow className="!text-center">about codú</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-fg sm:text-6xl">
            The community for{" "}
            <span className="text-accent">AI builders</span> &amp; indie hackers
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Learn to build with AI, share what you ship, and grow with people doing
            the same.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/get-started" className="primary-button px-7 py-3 text-base">
              Join free
            </Link>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <Eyebrow>what codú is for</Eyebrow>
          <div className="mt-6 space-y-6 text-lg leading-relaxed text-muted">
            <p>
              The most interesting software today is being built with AI — by small
              teams and solo builders shipping real products. That&apos;s who Codú is
              for: AI builders and indie hackers who want to learn faster, share what
              they ship, and grow alongside people doing the same.
            </p>
            <p>
              We started as a place to learn web development. The craft still matters —
              and that content still lives here — but the conversation has moved.
              Builders today need to know what&apos;s actually working with AI right
              now, how to ship it without it falling over, and where to spend their
              limited time. Less theory, more shipping.
            </p>
            <p>
              So Codú is global and online-first. A curated feed instead of noise.
              Practical tutorials over hype. A community where you can post what
              you&apos;re building and get real feedback.
            </p>
            <p className="font-medium text-fg">
              If you&apos;re building something with AI, this is your community.
            </p>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Eyebrow>what you get</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Everything in one place — free to start.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {whatYouGet.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group rounded-xl border border-hairline bg-canvas p-6 transition-colors hover:border-accent/50"
              >
                <h3 className="font-display text-lg font-bold text-fg group-hover:text-accent">
                  {item.title}
                </h3>
                <p className="mt-2 text-muted">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Founder note (small, honest) */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <div className="rounded-2xl border border-hairline bg-surface p-8">
            <Eyebrow>a note from the founder</Eyebrow>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              I started Codú because I learn best around other builders, and I wanted a
              place that stayed honest about what actually works. I&apos;ve spent years
              building software in production — a lot of it AI — and this is where I
              want to share the practical lessons and learn from what you&apos;re
              building too. No hype, no gatekeeping. Just builders helping each other
              ship.
            </p>
            <p className="mt-6 font-mono text-sm text-faint">
              — Niall Maher,{" "}
              <Link href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                X
              </Link>{" "}
              ·{" "}
              <Link href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                LinkedIn
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Start building with us.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Join free, share what you&apos;re building, and grow with a community of AI
            builders and indie hackers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <Link href="/get-started" className="primary-button px-7 py-3 text-base">
              Get started
            </Link>
            <Link
              href="/feed"
              className="font-mono text-sm font-semibold text-fg hover:text-accent"
            >
              Browse the feed ›
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
