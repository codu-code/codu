import Link from "next/link";
import Image from "next/image";
import { NewsletterCapture } from "@/components/ds";
import {
  discordInviteUrl,
  githubUrl,
  twitterUrl,
  linkedinUrl,
} from "@/config/site_settings";

const columns = [
  {
    title: "Explore",
    links: [
      { name: "Feed", href: "/feed" },
      { name: "Articles", href: "/articles" },
      { name: "Jobs", href: "/jobs" },
      { name: "Events", href: "https://www.meetup.com/codu-community/" },
    ],
  },
  {
    title: "Codú",
    links: [
      { name: "About", href: "/about" },
      { name: "Advertise", href: "/advertise" },
      { name: "Code of Conduct", href: "/code-of-conduct" },
      { name: "Privacy", href: "/privacy" },
    ],
  },
];

const socials = [
  { name: "Discord", href: discordInviteUrl },
  { name: "X", href: twitterUrl },
  { name: "GitHub", href: githubUrl },
  { name: "LinkedIn", href: linkedinUrl },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="Codú home">
              <Image
                src="/images/codu.png"
                alt="Codú"
                width={189}
                height={60}
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted">
              The community for AI builders &amp; indie hackers. Learn, ship, and
              grow with people doing the same.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-fg"
                    >
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <NewsletterCapture variant="compact" />
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 sm:flex-row">
          <p className="font-mono text-xs text-faint">
            © {new Date().getFullYear()} Codú. Built for builders.
          </p>
          <div className="flex gap-5">
            {socials.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-faint transition-colors hover:text-accent"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
