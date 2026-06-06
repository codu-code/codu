import Link from "next/link";
import Image from "next/image";
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
        <Link href="/" aria-label="Codú home">
          <Image
            src="/images/codu.png"
            alt="Codú"
            width={189}
            height={60}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link
              key={l.name}
              href={l.href}
              className="group relative text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              {l.name}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-200 group-hover:w-full" />
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
