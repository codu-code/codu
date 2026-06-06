import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-gradient-to-r from-orange-400 to-pink-600 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Start building with us
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
          Join free, share what you&apos;re building, and grow with a community
          of AI builders and indie hackers.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <Link
            href="/get-started"
            className="rounded-lg bg-white px-10 py-4 text-lg font-semibold text-pink-600 transition-all hover:bg-pink-50 hover:shadow-md"
          >
            Get started
          </Link>
          <Link
            href="/feed"
            className="font-semibold leading-6 text-white hover:underline"
          >
            Browse feed <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
