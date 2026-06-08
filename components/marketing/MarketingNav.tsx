import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";

/**
 * Slim info-page header (relaunch handoff): a "‹ Back to feed" link + the Codú
 * wordmark, on a hairline, backdrop-blurred sticky bar. No full marketing nav.
 * `session` is accepted to keep the (marketing) layout contract intact.
 */
export function MarketingNav({ session }: { session: Session | null }) {
  void session;
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-container-wide items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-mono text-sm text-muted transition-colors hover:text-fg"
        >
          ‹ Back to feed
        </Link>

        <Link href="/" aria-label="Codú home">
          <Image
            src="/images/codu.png"
            alt="Codú"
            width={189}
            height={60}
            className="h-6 w-auto"
            priority
          />
        </Link>
      </nav>
    </header>
  );
}
