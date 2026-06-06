import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 py-20 sm:py-32">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-pink-600/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* Badge */}
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-400/10 to-pink-600/10 px-4 py-1.5 text-sm font-medium text-orange-400 ring-1 ring-orange-400/30">
          Partner with Codú
        </span>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Reach{" "}
          <span className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
            20,000+
          </span>{" "}
          Builders Every Month
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300 sm:text-xl">
          Connect your brand with one of the most engaged communities of AI
          builders and indie hackers online. From newsletter ads to event
          sponsorships, we help you hire and grow.
        </p>

        {/* Single CTA - research shows single CTA converts 266% better */}
        <div className="mt-10 flex justify-center">
          <Link href="#contact" className="primary-button px-10 py-4 text-lg">
            Let&apos;s Talk
          </Link>
        </div>
      </div>
    </section>
  );
}
