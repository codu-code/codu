import Link from "next/link";

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 py-20 sm:py-32">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-pink-600/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* Badge */}
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-400/10 to-pink-600/10 px-4 py-1.5 text-sm font-medium text-orange-400 ring-1 ring-orange-400/30">
          About Codú
        </span>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          The community for{" "}
          <span className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
            AI builders
          </span>{" "}
          &amp; indie hackers
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300 sm:text-xl">
          Learn to build with AI, share what you ship, and grow with people
          doing the same.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Link href="/get-started" className="primary-button px-10 py-4 text-lg">
            Join free
          </Link>
          <Link
            href="/feed"
            className="font-semibold leading-6 text-white hover:text-orange-400"
          >
            Browse the feed <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
