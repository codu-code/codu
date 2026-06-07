import type { Metadata } from "next";
import { Eyebrow } from "@/components/ds";

export const metadata: Metadata = {
  title: "Advertise with Codú — Reach a global community of AI builders",
  description:
    "Partner with Codú to reach a global community of AI builders and indie hackers. A few honest placements: a newsletter slot, a featured job, or an ongoing feed partnership.",
};

const tiers = [
  {
    name: "Newsletter slot",
    price: "from €400",
    desc: "A sponsor block in Codú Weekly — in front of builders deciding what to adopt next.",
    feats: ["1 issue", "Full Weekly list", "Logo + 50 words"],
  },
  {
    name: "Featured job",
    price: "€250 / 30 days",
    desc: "Pin your role to the top of the job board, in front of product-minded engineers and indie hackers.",
    feats: ["Top of /jobs", "Featured badge", "Feed cross-post"],
    highlight: true,
  },
  {
    name: "Feed partner",
    price: "let's talk",
    desc: "An ongoing, honest presence across the feed and right rail for tools builders actually use.",
    feats: ["Right-rail unit", "Curated source", "Custom terms"],
  },
];

export default function AdvertisePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-50 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]"
        />
        <div className="relative mx-auto max-w-container px-5 py-20 sm:px-8 sm:py-24">
          <Eyebrow>advertise</Eyebrow>
          <h1 className="mt-6 max-w-[15ch] font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-fg sm:text-6xl">
            Reach builders who <span className="text-accent">ship</span>.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-muted">
            Codú is a focused audience of AI builders and indie hackers — the
            people deciding what tools to adopt next. No banner farm. Just a few
            honest placements, in a room people trust.
          </p>
        </div>
      </section>

      {/* Placement tiers */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-container px-5 py-20 sm:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`card flex flex-col gap-4 p-6 ${
                  t.highlight ? "border-accent" : ""
                }`}
              >
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight text-fg">
                    {t.name}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-accent-soft">
                    {t.price}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-muted">{t.desc}</p>
                <ul className="flex flex-col gap-2">
                  {t.feats.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted"
                    >
                      <span className="text-accent">→</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@codu.co"
                  className={`${
                    t.highlight ? "primary-button" : "secondary-button"
                  } mt-auto justify-center`}
                >
                  Get in touch
                </a>
              </div>
            ))}
          </div>
          <p className="mt-8 font-mono text-sm text-faint">
            Questions?{" "}
            <a
              href="mailto:hello@codu.co"
              className="text-accent-soft hover:underline"
            >
              hello@codu.co
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
