"use client";

import { useState } from "react";
import "atropos/css";
import Atropos from "atropos/react";
import Image from "next/image";
import space from "public/images/home/space.jpg";
import rocketman from "public/images/home/rocketman.png";
import moon from "public/images/home/moon.png";

export default function Hero() {
  const [rocketLoaded, setRocketLoaded] = useState(false);
  const [moonLoaded, setMoonLoaded] = useState(false);
  const [starsLoaded, setStarsLoaded] = useState(false);

  const isReady = rocketLoaded && moonLoaded && starsLoaded;

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="relative">
      <Atropos
        rotateXMax={0.4}
        rotateYMax={0.4}
        stretchX={1}
        stretchY={0.2}
        stretchZ={0.3}
        highlight={false}
        className="relative h-[calc(100vh_-_100px)] max-h-[calc(100svh_-_100px)] w-full overflow-hidden sm:h-[900px] [&>span.atropos-scale]:pointer-events-none [&_span.atropos-rotate]:pointer-events-auto"
      >
        <Image
          placeholder="blur"
          className="absolute -z-10 h-full w-full object-cover"
          src={space}
          data-atropos-offset="-2"
          alt="Realistic space sky which is black with stars scattered across."
          onLoad={() => {
            setStarsLoaded(true);
          }}
        />

        <div className="absolute -bottom-28  left-0 right-0 -z-10 mx-auto max-h-[480px] max-w-[480px] sm:-bottom-60 sm:max-h-[800px] sm:max-w-[600px] md:-bottom-96 md:max-h-[800px] md:max-w-[800px]">
          <div className="relative mx-auto brightness-75">
            <Image
              src={moon}
              data-atropos-offset="1"
              alt="Photograph of the moon"
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
              }}
              onLoad={() => {
                setMoonLoaded(true);
              }}
            />
          </div>
          <div className="absolute right-0 top-10 h-[240px] w-[240px] md:-right-28 md:h-[350px] md:w-[350px]">
            <Image
              height={350}
              width={350}
              src={rocketman}
              data-atropos-offset="8"
              alt="3D claymation style model of a astronaut on a rocket"
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto",
              }}
              onLoad={() => {
                setRocketLoaded(true);
              }}
            />
          </div>
        </div>

        <div
          data-atropos-offset="0"
          className="flex h-full flex-col justify-center"
        >
          <Image
            width={340}
            height={200}
            src="/images/codu.svg"
            alt="Codú logo"
            className={`mx-auto w-[240px] object-contain transition duration-500 sm:w-[340px] ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
          />
          <h1
            className={`mt-8 text-center text-5xl font-extrabold tracking-tight text-white drop-shadow-2xl duration-500 sm:text-7xl ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
          >
            A{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text text-transparent">
              space
            </span>{" "}
            for coders
          </h1>
          <div className="mt-12 flex justify-center">
            <button
              aria-label="Scroll to call to action"
              className="focus-style-rounded animate-bounce rounded-full border-2 bg-neutral-900 bg-opacity-60 p-4"
              onClick={() => handleScroll("cta")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="#ffffff"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black"
          data-atropos-offset="-2"
        />
        <div
          className="absolute top-0 h-20 w-full bg-gradient-to-b from-black"
          data-atropos-offset="-2"
        />
      </Atropos>
    </main>
  );
}
