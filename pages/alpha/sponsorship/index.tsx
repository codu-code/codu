import type { NextPage } from "next";

import Layout from "../../../components/Layout/Layout";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useEffect } from "react";

import pic1 from "../../../public/images/sponsors/pic1.png";
import pic2 from "../../../public/images/sponsors/pic2.png";
import pic3 from "../../../public/images/sponsors/pic3.png";
import pic4 from "../../../public/images/sponsors/pic4.png";
import pic5 from "../../../public/images/sponsors/pic5.png";

interface Image {
  rotate: number;
  src: StaticImageData;
  alt: string;
}

const images: Image[] = [
  {
    src: pic1,
    alt: "Audience watching a presentation",
    rotate: 6.56,
  },
  {
    src: pic2,
    alt: "Audience watching a presentation with the name 'Codú' on the screen",
    rotate: -3.57,
  },
  {
    src: pic3,
    alt: "Six people from Codú smiling at the camera",
    rotate: 4.58,
  },
  {
    src: pic4,
    alt: "Audience watching a presentation",
    rotate: -4.35,
  },
  {
    src: pic5,
    alt: "Audience smiling at the camera",
    rotate: 6.56,
  },
];

const Sponsorship: NextPage = () => {
  useEffect(() => {
    function handleScroll() {
      document.body.style.setProperty("--scroll", String(window.scrollY));
    }
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.style.removeProperty("--scroll");
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
            {images.map((image) => (
              <div
                key={image.alt}
                className={`w-32`}
                style={{
                  transform: `rotate(calc(min(var(--scroll), 200) / 200 * ${image.rotate}deg))`,
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
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
                  globally. Your funds go directly towards building the
                  community and a flourishing ecosystem.
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
