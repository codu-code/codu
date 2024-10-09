"use client";

import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex w-full flex-grow flex-col justify-center bg-white px-4 py-20 sm:px-6 lg:py-40">
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
            Well this is embarrassing
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
            Something went wrong.
          </h1>
          <p className="mt-2 text-base text-neutral-500">
            Something unexpected happened, we will look into it!
          </p>
          <div className="mt-6">
            <Link
              className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-base font-semibold tracking-wide text-transparent"
              href="/"
            >
              Return home<span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
          <div className="mt-6 text-base text-neutral-500">
            Or <span className="font-semibold">if you are feeling helpful</span>
            , send us more details by opening an issue{" "}
            <a
              className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-base font-semibold tracking-wide text-transparent"
              target="_blank"
              rel="nofollow"
              href="https://github.com/codu-code/codu/issues/new"
            >
              here
            </a>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
