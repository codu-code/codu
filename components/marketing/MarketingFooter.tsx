import Link from "next/link";

/**
 * Slim info-page footer (relaunch handoff): hairline-topped, mono cross-links
 * between the info pages, and a quiet copyright line.
 */
const infoLinks = [
  { name: "Privacy", href: "/privacy" },
  { name: "Code of conduct", href: "/code-of-conduct" },
  { name: "Advertise", href: "/advertise" },
  { name: "About", href: "/about" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-container-wide flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {infoLinks.map((l, i) => (
            <span key={l.name} className="flex items-center gap-x-4">
              <Link
                href={l.href}
                className="font-mono text-xs text-muted transition-colors hover:text-fg"
              >
                {l.name}
              </Link>
              {i < infoLinks.length - 1 && (
                <span aria-hidden className="text-faint">
                  ·
                </span>
              )}
            </span>
          ))}
        </nav>
        <p className="font-mono text-xs text-faint">
          © {new Date().getFullYear()} Codú · codu.co
        </p>
      </div>
    </footer>
  );
}
