import Link from "next/link";
import Image from "next/image";

// Bare, distraction-free auth shell — no nav, no sidebar, no footer.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas text-fg">
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots bg-[length:24px_24px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <header className="relative px-6 py-6">
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
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-24">
        {children}
      </main>
    </div>
  );
}
