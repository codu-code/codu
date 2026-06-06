import Link from "next/link";
import { twitterUrl, linkedinUrl } from "@/config/site_settings";

export function FounderNote() {
  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            A note from the founder
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-300">
            I started Codú because I learn best around other builders, and I
            wanted a place that stayed honest about what actually works. I&apos;ve
            spent years building software in production — a lot of it AI — and
            this is where I want to share the practical lessons and learn from
            what you&apos;re building too. No hype, no gatekeeping. Just builders
            helping each other ship.
          </p>
          <p className="mt-6 text-sm text-neutral-500">
            — Niall Maher,{" "}
            <Link
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              X
            </Link>{" "}
            ·{" "}
            <Link
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              LinkedIn
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
