import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, NewsletterCapture } from "@/components/ds";
import { twitterUrl, linkedinUrl } from "@/config/site_settings";

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

/* The two things Codú cares about. */
const craftWhy = [
  {
    title: "The craft",
    body: "How to build things that hold up in the real world. The newest tools, AI front and center, and the skill to use them well instead of bolting them on. Productivity, depth, shipping something solid.",
  },
  {
    title: "The why",
    body: "Who is this for? What problem does it solve? Would they pay for it? Most software dies because nobody asked. We ask first.",
  },
];

/* The three builders Codú is for (from the handoff PERSONAS). */
const personas = [
  {
    tag: "The product-minded engineer",
    quote: "I can build anything. I'm just not sure I'm building the right thing.",
    why: "We're obsessed with the why. You'll learn to think like a product engineer, not just a coder — and that mindset on top of your skills is rare in any market.",
  },
  {
    tag: "The solo builder",
    quote: "I want to stop building things nobody wants.",
    why: "We'll pressure-test your ideas before you sink time into them, and sharpen the skills that let one person do what used to take a team.",
  },
  {
    tag: "The builder riding the wave",
    quote:
      "Everything's changing fast. I want to ride it properly, not just play with demos.",
    why: "This is the room where people show the traces, the costs, and the failures. Keep up with what's new without losing the plot on what's worth your time.",
  },
];

const notForYou = [
  "It isn't a place to farm followers, drop your launch link, and leave.",
  "It isn't a hype feed chasing whatever's trending this week.",
  "And it isn't a beginner's first “learn to code” stop — though we'll never gatekeep or make you feel small for asking.",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero / manifesto opener */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto max-w-container px-5 py-20 sm:px-8 sm:py-24">
          <Eyebrow>what codú is</Eyebrow>
          <h1 className="mt-6 max-w-[15ch] font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-fg sm:text-6xl">
            The community for{" "}
            <span className="text-accent">AI builders</span> &amp; indie hackers
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted">
            Codú is a place to get genuinely good. Not a launch board. Not a
            feed of “look what I made.” It&apos;s where AI builders and indie
            hackers learn faster, share what they ship, and grow alongside
            people doing the same. We care about two things.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/get-started"
              className="primary-button px-7 py-3 text-base"
            >
              Join free
            </Link>
            <Link
              href="/"
              className="font-mono text-sm font-semibold text-fg hover:text-accent"
            >
              Browse the feed ›
            </Link>
          </div>
        </div>
      </section>

      {/* The craft / the why */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2">
            {craftWhy.map((c) => (
              <div key={c.title} className="card p-6">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-fg">
                  {c.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder note (light, personal) */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <Eyebrow>who&apos;s behind it</Eyebrow>
          <blockquote className="mt-6 max-w-[30ch] font-display text-2xl font-extrabold leading-snug tracking-tight text-fg sm:text-3xl">
            “Tools come and go. The builder who asks{" "}
            <span className="text-accent">
              ‘what is this for, and would they pay?’
            </span>{" "}
            wins in any era. AI is the biggest lever that builder has ever been
            handed — but it was never the point. The point is building things
            that matter.”
          </blockquote>
          <p className="mt-6 max-w-prose leading-relaxed text-muted">
            I&apos;m Niall, and I founded Codú. I&apos;ve spent years building
            software in production — a lot of it AI — and I still ship my own
            things on weekends. This is where I want to share the practical
            lessons and learn from what you&apos;re building too. No hype, no
            gatekeeping. Just builders helping each other ship.
          </p>
          <p className="mt-6 font-mono text-sm text-faint">
            — Niall Maher, Founder, Codú ·{" "}
            <Link
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              X
            </Link>{" "}
            ·{" "}
            <Link
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              LinkedIn
            </Link>
          </p>
        </div>
      </section>

      {/* Who Codú is for — the three builders */}
      <section className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <Eyebrow>who codú is for</Eyebrow>
          <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted">
            Three kinds of builder. You&apos;ll see yourself in at least one —
            and the thread is the same: you want to build things that matter,
            and you care why.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {personas.map((p) => (
              <div key={p.tag} className="card flex flex-col gap-4 p-6">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
                  {p.tag}
                </p>
                <p className="font-display text-lg font-bold leading-snug text-fg">
                  “{p.quote}”
                </p>
                <p className="text-sm leading-relaxed text-muted">{p.why}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's not for */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-container gap-x-12 gap-y-8 px-5 py-20 sm:px-8 md:grid-cols-2">
          <div>
            <Eyebrow>who it&apos;s not for</Eyebrow>
            <h2 className="mt-4 max-w-[14ch] font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              We&apos;re not for everyone. That&apos;s the point.
            </h2>
            <p className="mt-6 max-w-[22ch] font-display text-xl font-bold leading-snug text-fg">
              If you want applause, there are easier rooms. If you want to get
              genuinely good, <span className="text-accent">come in.</span>
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {notForYou.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 border-t border-hairline pt-4"
              >
                <span className="font-mono text-sm text-faint">✕</span>
                <span className="leading-relaxed text-muted">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Codú Weekly newsletter band */}
      <section className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <NewsletterCapture />
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <h2 className="max-w-[18ch] font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              If you&apos;re building something with AI, this is your community.
            </h2>
            <Link
              href="/get-started"
              className="primary-button px-7 py-3 text-base"
            >
              Join free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
