import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout/Layout";

const FourOhFour: NextPage = () => {
  return (
    <Layout>
      <main className="bg-white flex-grow flex flex-col justify-center w-full px-4 sm:px-6 lg:py-40 py-20">
        <div className="flex-shrink-0 flex justify-center">
          <Link href="/">
            <a>
              <span className="sr-only">Codú</span>
              <Image
                src="/images/codu-black.png"
                alt="Codú logo"
                height={60}
                width={189}
              />
            </a>
          </Link>
        </div>
        <div className="py-16">
          <div className="text-center">
            <p className="text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
              404 error
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-black tracking-tight sm:text-5xl">
              Page not found.
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Sorry, we couldn’t find the page you’re looking for.
            </p>
            <div className="mt-6">
              <Link href="/">
                <a className="text-base bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide">
                  Go back home<span aria-hidden="true"> &rarr;</span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default FourOhFour;
