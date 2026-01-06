import Link from "next/link";
import {
  EnvelopeOpenIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const offerings = [
  {
    icon: EnvelopeOpenIcon,
    title: "Newsletter Advertising",
    description:
      "Feature your company in our weekly newsletter reaching 4,000+ engaged developers who actually read their emails.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Event Sponsorship",
    description:
      "Put your brand in front of 100+ developers at our monthly meetups and annual hackathons. Build real connections.",
  },
  {
    icon: GlobeAltIcon,
    title: "Website & Job Board",
    description:
      "Reach 20,000+ monthly visitors with banner placements and job postings to a highly engaged developer audience.",
  },
  {
    icon: DocumentTextIcon,
    title: "Content Collaboration",
    description:
      "Co-create technical content that positions your brand as a thought leader. Authentic content that resonates.",
  },
];

export function OfferingsSection() {
  return (
    <section id="offerings" className="bg-black py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ways to Partner
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            Every partnership is tailored to your goals. Here&apos;s how we can
            help you connect with our developer community.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {offerings.map((offering) => (
            <div
              key={offering.title}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400/20 to-pink-600/20 transition-colors group-hover:from-orange-400/30 group-hover:to-pink-600/30">
                  <offering.icon className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {offering.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {offering.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="#contact"
            className="primary-button inline-flex items-center gap-2"
          >
            Let&apos;s discuss what works for you
          </Link>
        </div>
      </div>
    </section>
  );
}
