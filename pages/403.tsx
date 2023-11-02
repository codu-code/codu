import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Layout from "../components/Layout/Layout";

const FourOhThree: NextPage = () => {
  return (
    <Layout>
      <main className="bg-white flex-grow flex flex-col justify-center w-full px-4 sm:px-6 lg:py-40 py-20">
        <div className="flex-shrink-0 flex justify-center">
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
            <p className="text-xl leading-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide uppercase">
              403 error
            </p>
            <h1 className="mt-2 text-4xl font-extrabold text-black tracking-tight sm:text-5xl">
              Forbidden
            </h1>
            <p className="mt-2 text-base text-neutral-500">
              Sorry, are not allowed to access the page you&apos;re looking for.
            </p>
            <div className="mt-6">
              <Link
                className="text-base bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 font-semibold tracking-wide"
                href="/"
              >
                Return home<span aria-hidden="true"> &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default FourOhThree;
