import Link from "next/link";
import type { Session } from "next-auth";

const links = [
  { name: "Feed", href: "/feed" },
  { name: "Jobs", href: "/jobs" },
  { name: "About", href: "/about" },
];

export function MarketingNav({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-display text-xl font-extrabold tracking-tight text-fg"
        >
          Codú<span className="text-accent">.</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.name}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              {l.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/feed"
              className="primary-button px-4 py-2 text-sm"
            >
              Open Codú
            </Link>
          ) : (
            <>
              <Link
                href="/get-started"
                className="hidden text-sm font-medium text-muted transition-colors hover:text-fg sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/get-started"
                className="primary-button px-4 py-2 text-sm"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
