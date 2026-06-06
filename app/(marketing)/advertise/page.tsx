import type { Metadata } from "next";
import Image from "next/image";
import {
  EnvelopeOpenIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Eyebrow } from "@/components/ds";
import { ContactForm } from "@/components/Sponsorship/ContactForm";

export const metadata: Metadata = {
  title: "Advertise with Codú — Reach a global community of AI builders",
  description:
    "Partner with Codú to reach a global community of AI builders and indie hackers. Newsletter ads, job postings, event branding, and content collaboration.",
};

const offerings = [
  {
    icon: EnvelopeOpenIcon,
    title: "Newsletter",
    body: "Get in front of engaged builders in Codú Weekly — people who actually read their email and try new tools.",
  },
  {
    icon: BriefcaseIcon,
    title: "Job board",
    body: "Post AI-developer roles to builders who want to get paid to work with AI. Featured placement available.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Events",
    body: "Sponsor meetups and hackathons and put your brand in front of builders in the room.",
  },
  {
    icon: DocumentTextIcon,
    title: "Content collaboration",
    body: "Co-create a hands-on 'build with X' tutorial that shows builders your product in real use.",
  },
];

const sponsors = [
  { name: "Version 1", logo: "/images/sponsors/version1.png" },
  { name: "LearnUpon", logo: "/images/sponsors/learnupon.png" },
  { name: "OfferZen", logo: "/images/sponsors/offerzen.png" },
  { name: "WeWork", logo: "/images/sponsors/wework.png" },
  { name: "Harvey Nash", logo: "/images/sponsors/harveynash.png" },
  { name: "NineDots", logo: "/images/sponsors/ninedots.png" },
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
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-28">
          <Eyebrow className="!text-center">partner with codú</Eyebrow>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-fg sm:text-6xl">
            Reach a global community of{" "}
            <span className="text-accent">AI builders</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Codú reaches indie hackers and AI builders who ship. Newsletter,
            jobs, events, and content — find the right fit and we&apos;ll make it
            work.
          </p>
          <div className="mt-9 flex justify-center">
            <a href="#contact" className="primary-button px-7 py-3 text-base">
              Let&apos;s talk
            </a>
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <Eyebrow>ways to partner</Eyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            Built around getting your product in front of builders.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {offerings.map((o) => (
              <div
                key={o.title}
                className="rounded-xl border border-hairline bg-surface p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                  <o.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-fg">
                  {o.title}
                </h3>
                <p className="mt-2 text-muted">{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by (real past partners) */}
      <section className="border-b border-hairline bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-faint">
            Trusted by teams who&apos;ve partnered with Codú
          </p>
          <div className="mt-8 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {sponsors.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-center rounded-lg border border-hairline bg-canvas p-4"
              >
                <Image
                  src={s.logo}
                  alt={s.name}
                  width={120}
                  height={48}
                  className="h-8 w-auto max-w-full object-contain opacity-70"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact">
        <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <div className="text-center">
            <Eyebrow className="!text-center">get in touch</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
              Let&apos;s find the right fit.
            </h2>
            <p className="mt-3 text-muted">
              Tell us what you&apos;re after and we&apos;ll get back within 24
              hours.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-hairline bg-surface p-6 sm:p-8">
            <ContactForm />
          </div>
          <p className="mt-6 text-center text-sm text-faint">
            Prefer email?{" "}
            <a
              href="mailto:partnerships@codu.co"
              className="text-accent hover:underline"
            >
              partnerships@codu.co
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
