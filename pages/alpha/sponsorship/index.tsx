import type { NextPage } from "next";

import Layout from "../../../components/Layout/Layout";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";

interface Image {
  rotate: number;
  src: string;
  alt: string;
}

const images: Image[] = [
  {
    src: "/images/sponsors/pic1.png",
    alt: "Audience watching a presentation",
    rotate: 6.56,
  },
  {
    src: "/images/sponsors/pic2.png",
    alt: "Audience watching a presentation with the name 'Codú' on the screen",
    rotate: -3.57,
  },
  {
    src: "/images/sponsors/pic3.png",
    alt: "Six people from Codú smiling at the camera",
    rotate: 4.58,
  },
  {
    src: "/images/sponsors/pic4.png",
    alt: "Audience watching a presentation",
    rotate: -4.35,
  },
  {
    src: "/images/sponsors/pic5.png",
    alt: "Audience smiling at the camera",
    rotate: 6.56,
  },
];

const Sponsorship: NextPage = () => {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setScroll(window.scrollY);
    }
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <Layout>
        <div>
          <header className="bg-white text-black text-center pt-10 pb-24 px-4 sm:pb-36 sm:text-left sm:px-10 md:pb-44 md:px-20 lg:px-36 lg:pt-14">
            <h1 className="font-extrabold text-3xl md:text-4xl md:mb-2 lg:text-5xl">
              Become a{" "}
              <b className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600 z-20 font-extrabold">
                Sponsor
              </b>
            </h1>
            <h3 className="text-lg font-bold">
              Reach thousands of developers every month!
            </h3>
          </header>
          <section className="flex items-center relative bottom-12 justify-center overflow-hidden gap-8 sm:gap-20 sm:bottom-20 md:bottom-24  md:gap-36 lg:gap-44">
            {images.map((image, id) => (
              <div
                key={id}
                className={`w-32`}
                style={{
                  transform: `${
                    scroll < 200
                      ? `rotate(${(scroll / 200) * image.rotate}deg)`
                      : `rotate(${image.rotate}deg)`
                  }`,
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={250}
                  height={250}
                  className="max-w-[150px] sm:max-w-[200px] md:max-w-none"
                />
              </div>
            ))}
          </section>
          <main className="bg-black px-4 sm:px-10 pb-20 flex flex-col lg:flex-row lg:items-center sm:pt-8 md:px-20 lg:pt-2 lg:pb-40 lg:px-36 lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-4 max-w-2xl">
              <h2 className="text-xl sm:text-2xl font-bold">
                Trusted by brands both large and small
              </h2>
              <div className="flex flex-col gap-4 text-md sm:text-lg">
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
              <div className="max-w-[200px]">
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
          <section className="sm:px-10 md:px-20 lg:px-36">
            <div className="bg-white py-4 text-center w-full flex flex-col items-center gap-4 sm:rounded-lg lg:justify-between lg:py-8">
              <h2 className="text-black font-extrabold text-lg lg:text-2xl">
                Let us help you amplify your brand.
              </h2>
              <Link
                className="flex-inline items-center ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                href="/sponsorship/docs/info.pdf"
              >
                Find out more
              </Link>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default Sponsorship;
