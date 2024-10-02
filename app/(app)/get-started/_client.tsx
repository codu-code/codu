"use client";

import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/20/solid";

const GetStarted: NextPage = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  const [userEmail, setUserEmail] = useState<string>("");

  const redirectTo =
    typeof callbackUrl === "string" ? callbackUrl : "/articles";

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
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
                className="w-full flex-auto appearance-none rounded-md border-neutral-200 bg-white pl-6 text-base font-medium text-neutral-950 ring-offset-0 placeholder:text-base placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-transparent focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white  [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
                placeholder="Enter your email"
                type="email"
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
                className="group relative mt-6 inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                Continue
              </button>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-neutral-400 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm font-medium ">
                <span className="bg-neutral-100 px-6 text-base uppercase text-neutral-600 dark:bg-black  dark:text-neutral-400">
                  Or
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
          className="group relative inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <LockClosedIcon
              className="h-5 w-5 text-orange-600 group-hover:text-white"
              aria-hidden="true"
            />
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="sr-only">Sign in with GitHub</span>
            <svg
              className="h-5 w-5 text-pink-800 group-hover:text-white"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          Continue with GitHub
        </button>
        <button
          type="button"
          onClick={async () => {
            await signIn("gitlab", { callbackUrl: redirectTo });
          }}
          className="group relative inline-flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
        >
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <LockClosedIcon
              className="h-5 w-5 text-orange-600 group-hover:text-white"
              aria-hidden="true"
            />
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="sr-only">Sign in with GitLab</span>
            <svg
              viewBox="-.1 .5 960.1 923.7"
              className="h-5 w-5 text-pink-800 group-hover:text-white"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="m958.9 442.4c1.1 26.1-2 52.1-9.2 77.2-7.1 25.1-18.3 48.8-33.1 70.3a240.43 240.43 0 0 1 -53.6 56.2l-.5.4-199.9 149.8-98.3 74.5-59.9 45.2c-3.5 2.7-7.4 4.7-11.5 6.1s-8.5 2.1-12.9 2.1c-4.3 0-8.7-.7-12.8-2.1s-8-3.4-11.5-6.1l-59.9-45.2-98.3-74.5-198.7-148.9-1.2-.8-.4-.4c-20.9-15.7-39-34.7-53.8-56.2s-26-45.3-33.2-70.4c-7.2-25.1-10.3-51.2-9.2-77.3 1.2-26.1 6.5-51.8 15.8-76.2l1.3-3.5 130.7-340.5q1-2.5 2.4-4.8 1.3-2.3 3.1-4.3 1.7-2.1 3.7-3.9 2-1.7 4.2-3.2c3.1-1.9 6.3-3.3 9.8-4.1 3.4-.9 7-1.3 10.5-1.1 3.6.2 7.1.9 10.4 2.2 3.3 1.2 6.5 3 9.3 5.2q2 1.7 3.9 3.6 1.8 2 3.2 4.3 1.5 2.2 2.6 4.7 1.1 2.4 1.8 5l88.1 269.7h356.6l88.1-269.7q.7-2.6 1.9-5 1.1-2.4 2.6-4.7 1.4-2.2 3.2-4.2 1.8-2 3.9-3.7c2.8-2.2 5.9-3.9 9.2-5.2 3.4-1.2 6.9-1.9 10.4-2.1 3.6-.2 7.1.1 10.6 1 3.4.9 6.7 2.3 9.7 4.2q2.3 1.4 4.3 3.2 2 1.7 3.7 3.8 1.7 2.1 3.1 4.4 1.3 2.3 2.3 4.8l130.5 340.6 1.3 3.5c9.3 24.3 14.6 50 15.7 76.1z" />
            </svg>
          </span>
          Continue with GitLab
        </button>
      </div>
    </div>
  );
};

export default GetStarted;
