import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Codú Events - Coming soon",
};

// Wrapping while cleanup is completed and so PRs can be broken up
export default function Alpha({ children }: { children: ChildNode }) {
  if (process.env.ALPHA || process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }

  return (
    <main className="flex w-full flex-grow flex-col justify-center bg-neutral-100 px-4 py-20 sm:px-6 lg:py-40">
      <div className="flex flex-shrink-0 justify-center">
        <Link href="/">
          <span className="sr-only">Codú</span>
          <Image
            src="/images/codu-black.png"
            alt="Codú logo"
            height={60}
            width={189}
          />
        </Link>
      </div>
      <div className="py-16">
        <div className="text-center">
          <p className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-xl font-semibold uppercase leading-6 tracking-wide text-transparent">
            Something awesome
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
            Coming Soon
          </h1>
          <p className="mx-auto mt-2 max-w-lg px-4 text-sm text-neutral-500">
            {`We're testing our patience (and yours) as we upgrade our site. It's
            like waiting for a program to compile – seems long but worth the
            wait.`}
          </p>
          <div className="mt-6">
            <Link
              className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-base font-semibold tracking-wide text-transparent"
              href="/"
            >
              Return home<span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
