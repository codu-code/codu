"use client";

import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { THEME_MODES } from "@/components/Theme/ThemeToggle/ThemeToggle";
import { useEffect, useState } from "react";

export const PostAuthPage = (content: {
  heading: string;
  subHeading: string;
}) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // useEffect only happens on client not server
  useEffect(() => {
    setMounted(true);
  }, []);

  // if on server dont render. needed to prevent a hydration mismatch error
  if (!mounted) return null;

  return (
    <main className="flex w-full flex-grow flex-col justify-center bg-neutral-100 px-4 py-20 dark:bg-black sm:px-6 lg:py-40">
      <div className="flex flex-shrink-0 justify-center">
        <Link href="/">
          <span className="sr-only">Codú</span>
          <Image
            // Uses black codu logo if in light mode and white codu logo if in dark mode
            src={
              resolvedTheme === THEME_MODES.LIGHT
                ? "/images/codu-black.png"
                : "/images/codu.png"
            }
            alt="Codú logo"
            height={60}
            width={189}
          />
        </Link>
      </div>
      <div className="py-16">
        <div className="text-center">
          <p className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-xl font-semibold uppercase leading-6 tracking-wide text-transparent">
            {content.heading}{" "}
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-black dark:text-white sm:text-5xl">
            {content.subHeading}{" "}
          </h1>
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
};

const Auth: NextPage = () => {
  return PostAuthPage({
    heading: "Sign in email has been sent",
    subHeading: "See you soon 🚀",
  });
};

export default Auth;
