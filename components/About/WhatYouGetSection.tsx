import Link from "next/link";
import {
  DocumentTextIcon,
  RssIcon,
  EnvelopeOpenIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { discordInviteUrl } from "@/config/site_settings";

const items = [
  {
    icon: DocumentTextIcon,
    title: "Tutorials & articles",
    description:
      "Practical, hands-on writing from builders — how to actually build and ship with AI.",
    href: "/articles",
    external: false,
  },
  {
    icon: RssIcon,
    title: "A curated feed",
    description:
      "The signal, not the noise. What's worth reading this week for people building with AI.",
    href: "/feed",
    external: false,
  },
  {
    icon: EnvelopeOpenIcon,
    title: "Codú Weekly",
    description:
      "What to build with AI this week, in 5 minutes. Free, every Tuesday.",
    href: "https://newsletter.codu.co/",
    external: true,
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "A community that ships",
    description:
      "Share what you're building, get feedback, and grow with people doing the same. Free to join on Discord.",
    href: discordInviteUrl,
    external: true,
  },
];

export function WhatYouGetSection() {
  return (
    <section className="border-y border-neutral-800 bg-neutral-950 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            What you get
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            Everything in one place — and it&apos;s free to start.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400/20 to-pink-600/20 transition-colors group-hover:from-orange-400/30 group-hover:to-pink-600/30">
                  <item.icon className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
