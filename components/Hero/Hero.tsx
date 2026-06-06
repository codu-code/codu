import Link from "next/link";
import { Eyebrow } from "@/components/ds";

const CoduLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="463"
      height="150"
      fill="none"
      viewBox="0 0 463 150"
      className={className}
      aria-label="Codú logo"
      role="img"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M187 150a50 50 0 1 0 0-100 50 50 0 0 0 0 100Zm0-18a32 32 0 1 0 0-64 32 32 0 0 0 0 64Z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        d="M415.75 6.36a9 9 0 0 1 12.73 12.73l-18.39 18.39a9 9 0 0 1-12.73-12.73l18.39-18.39Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M341 0a9 9 0 0 0-9 9v52.58A50 50 0 1 0 350 100V9a9 9 0 0 0-9-9Zm-9 100a32 32 0 1 0-64 0 32 32 0 0 0 64 0Z"
        clipRule="evenodd"
      />
      <path
        fill="currentColor"
        d="M121.46 121.88c3.5 3.53 3.5 9.28-.42 12.33a75 75 0 1 1-.05-118.45c3.93 3.05 3.93 8.8.44 12.33-3.5 3.53-9.17 3.5-13.2.6a57 57 0 1 0 .03 92.6c4.04-2.9 9.7-2.94 13.2.59ZM363 59a9 9 0 1 1 18 0v41a32 32 0 0 0 64 0V59a9 9 0 1 1 18 0v82a9 9 0 1 1-18 0v-2.58A50 50 0 0 1 363 100V59Z"
      />
    </svg>
  );
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline bg-canvas">
      {/* Editorial dotted-grid atmosphere — no gradient, no blob. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots bg-[length:22px_22px] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:py-32">
        <CoduLogo className="mx-auto h-12 text-fg sm:h-14" aria-hidden="true" />

        <Eyebrow className="mt-10 !text-center">
          learn · build · ship · grow
        </Eyebrow>

        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-fg sm:text-6xl">
          The community for <span className="text-accent">AI builders</span> &amp;
          indie hackers
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
          Learn to build with AI, share what you ship, and grow with people doing
          the same.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Link href="/get-started" className="primary-button px-6 py-3 text-base">
            Join free
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
  );
}
