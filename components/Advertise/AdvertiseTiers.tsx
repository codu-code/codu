"use client";

import { useState } from "react";
import type { SponsorInterest } from "@/schema/sponsor";
import { ContactModal } from "./ContactModal";

type Tier = {
  name: string;
  price: string;
  desc: string;
  feats: string[];
  highlight?: boolean;
  /** When set, the CTA opens the contact modal pre-tagged with this interest. */
  interest: SponsorInterest;
  /** Label for the CTA button. */
  cta: string;
};

export function AdvertiseTiers({ tiers }: { tiers: Tier[] }) {
  const [openInterest, setOpenInterest] = useState<SponsorInterest | null>(
    null,
  );

  return (
    <>
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
            <button
              type="button"
              onClick={() => setOpenInterest(t.interest)}
              className={`${
                t.highlight ? "primary-button" : "secondary-button"
              } mt-auto justify-center`}
            >
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 font-mono text-sm text-faint">
        Questions?{" "}
        <button
          type="button"
          onClick={() => setOpenInterest("WEBSITE")}
          className="text-accent-soft hover:underline"
        >
          Get in touch
        </button>{" "}
        or email{" "}
        <a
          href="mailto:hello@codu.co"
          className="text-accent-soft hover:underline"
        >
          hello@codu.co
        </a>
      </p>

      <ContactModal
        key={openInterest ?? "closed"}
        open={openInterest !== null}
        onClose={() => setOpenInterest(null)}
        defaultInterest={openInterest ?? "WEBSITE"}
      />
    </>
  );
}
