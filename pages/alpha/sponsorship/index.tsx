import type { NextPage } from "next";

import Layout from "../../../components/Layout/Layout";
import Image from "next/image";
import Link from "next/link";

const Sponsorship: NextPage = () => {
  return (
    <Layout>
      <div>
        <header className="bg-white text-black text-center pt-10 pb-24 px-4">
          <h1 className="font-extrabold text-3xl">
            Become a{" "}
            <b className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 font-extrabold">
              Sponsor
            </b>
          </h1>
          <h3 className="text-lg font-bold">
            Reach thousands of developers every mounth!
          </h3>
        </header>
        <section className="flex items-center relative bottom-12 justify-center overflow-hidden gap-8">
          <div className="w-32">
            <Image
              src="/images/sponsors/pic1.png"
              alt=""
              width={150}
              height={150}
              className="max-w-none"
            />
          </div>
          <div className="w-32">
            <Image
              src="/images/sponsors/pic2.png"
              alt=""
              width={150}
              height={150}
              className="max-w-none"
            />
          </div>
          <div className="w-32">
            <Image
              src="/images/sponsors/pic3.png"
              alt=""
              width={150}
              height={150}
              className="max-w-none"
            />
          </div>
          <div className="w-32">
            <Image
              src="/images/sponsors/pic4.png"
              alt=""
              width={150}
              height={150}
              className="max-w-none"
            />
          </div>
          <div className="w-32">
            <Image
              src="/images/sponsors/pic5.png"
              alt=""
              width={150}
              height={150}
              className="max-w-none"
            />
          </div>
        </section>
        <main className="bg-black px-4 pb-20 flex flex-col lg:flex-row lg:items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">
              Trusted by brands both large and small
            </h2>
            <div className="flex flex-col gap-4">
              <p>
                Codú aims to create one of the largest coding communities
                globally. Your funds go directly towards building the community
                and a flourishing ecosystem.
              </p>
              <p>
                We offer opportunities to sponsor <b>hackathons</b>, monthly{" "}
                <b>events</b>, <b>giveaways</b> and <b>online ad space</b>.
              </p>
              <p>
                <a href="mailto:partnerships@codu.co" className="underline">
                  Contact us
                </a>{" "}
                today to find out more.
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-10 justify-between pt-10 flex-col sm:items-center sm:flex-row sm:justify-center">
            <div className="max-w-[200px]">
              <Image
                src="/images/sponsors/harveynash.png"
                alt=""
                width={300}
                height={300}
                className="w-full"
              />
            </div>
            <div className="max-w-[200px] text-center flex">
              <Image
                src="/images/sponsors/learnupon.png"
                alt=""
                width={300}
                height={300}
                className="w-full"
              />
            </div>
            <div className="max-w-[200px]">
              <Image
                src="/images/sponsors/offerzen.png"
                alt=""
                width={300}
                height={300}
              />
            </div>
            <div className="max-w-[200px]">
              <Image
                src="/images/sponsors/version1.png"
                alt=""
                width={300}
                height={300}
              />
            </div>
            <div className="max-w-[200px]">
              <Image
                src="/images/sponsors/wework.png"
                alt=""
                width={300}
                height={300}
              />
            </div>
          </div>
        </main>
        <div className="bg-white py-4 text-center w-full flex flex-col items-center gap-4">
          <h2 className="text-black font-extrabold text-lg">
            Let us help you amplify your brand.
          </h2>
          <Link
            className="flex-inline items-center ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
            href=""
          >
            Find out more
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Sponsorship;
