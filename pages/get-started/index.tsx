import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn, getProviders } from "next-auth/react";
import { useRouter } from "next/router";

import { LockClosedIcon } from "@heroicons/react/solid";

const GetStarted: NextPage = () => {
  const { callbackUrl } = useRouter().query;

  const redirectTo =
    typeof callbackUrl === "string" ? callbackUrl : "/articles";

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-12">
            <Link className="flex items-end" href="/">
              <span className="sr-only">Codú</span>
              <Image
                src="/images/codu.png"
                alt="Codú logo"
                className="invert dark:invert-0"
                height={60}
                width={189}
              />
              <span className="ml-2 -mb-2 text-base font-semibold">Beta</span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-white">
            Sign in or create your account
          </h2>
          <p className="mt-2 text-center text-base text-neutral-500">
            Or{" "}
            <Link className="font-medium fancy-link" href="/">
              return home
            </Link>
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={async () => {
              await signIn("github", { callbackUrl: redirectTo });
            }}
            className="group relative w-full border border-transparent text-base bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LockClosedIcon
                className="h-5 w-5 text-orange-600 group-hover:text-white"
                aria-hidden="true"
              />
            </span>
            <span className="absolute right-0 inset-y-0 flex items-center pr-3">
              <span className="sr-only">Sign in with GitHub</span>
              <svg
                className="w-5 h-5 text-pink-800 group-hover:text-white"
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
            Login with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
