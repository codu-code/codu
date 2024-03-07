"use client";

import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const GetStarted: NextPage = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  const [userEmail, setUserEmail] = useState<string>("");

  const redirectTo =
    typeof callbackUrl === "string" ? callbackUrl : "/articles";

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mb-12 flex justify-center">
            <Link className="flex items-end" href="/">
              <span className="sr-only">Codú</span>
              <Image
                src="/images/codu.png"
                alt="Codú logo"
                className="invert dark:invert-0"
                height={60}
                width={189}
              />
              <span className="-mb-2 ml-2 text-base font-semibold">Beta</span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-white">
            Sign in or create your account
          </h2>
          <p className="mt-2 text-center text-base text-neutral-500">
            Or{" "}
            <Link className="fancy-link font-medium" href="/">
              return home
            </Link>
          </p>
        </div>
        {!!process?.env.NEXT_PUBLIC_ALPHA && (
          <>
            <div>
              <input
                className="w-full flex-auto appearance-none rounded-md border-neutral-200 bg-white pl-6 font-medium text-neutral-950 ring-offset-0 placeholder:text-xl placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-transparent focus:ring-offset-2 dark:border-none dark:bg-neutral-900 dark:bg-neutral-900 dark:text-white dark:text-white  [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
                placeholder="Enter your email"
                onChange={(event) => {
                  setUserEmail(event.target.value);
                }}
                value={userEmail}
              />
              <button
                type="button"
                disabled={!userEmail}
                onClick={async () => {
                  await signIn("email", {
                    callbackUrl: redirectTo,
                    email: userEmail,
                  });
                }}
                className="group relative mt-6 inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-xl font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                Sign In / Sign Up
              </button>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-black dark:border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-neutral-100 px-6 text-xl text-neutral-900 dark:bg-black  dark:text-white">
                  Or continue with
                </span>
              </div>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={async () => {
            await signIn("github", { callbackUrl: redirectTo });
          }}
          className="group relative inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-xl font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
        >
          GitHub
        </button>
      </div>
    </div>
  );
};

export default GetStarted;
