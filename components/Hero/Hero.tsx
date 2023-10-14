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
        className="h-[calc(100vh_-_100px)] max-h-[calc(100svh_-_100px)] sm:h-[900px] w-full overflow-hidden relative [&>span.atropos-scale]:pointer-events-none [&_span.atropos-rotate]:pointer-events-auto"
      >
        <Image
          placeholder="blur"
          className="absolute h-full w-full object-cover -z-10"
          src={space}
          data-atropos-offset="-2"
          alt="Realistic space sky which is black with stars scattered across."
          onLoad={() => {
            setStarsLoaded(true);
          }}
        />

        <div className="absolute -z-10  md:max-h-[800px] md:max-w-[800px] sm:max-h-[800px] sm:max-w-[600px] max-h-[480px] max-w-[480px] left-0 right-0 mx-auto sm:-bottom-60 md:-bottom-96 -bottom-28">
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
          <div className="absolute h-[240px] w-[240px] md:h-[350px] md:w-[350px] right-0 md:-right-28 top-10">
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
          className="h-full flex flex-col justify-center"
        >
          <Image
            width={340}
            height={200}
            src="/images/codu.svg"
            alt="Codú logo"
            className={`w-[240px] sm:w-[340px] mx-auto object-contain transition duration-500 ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
          />
          <h1
            className={`drop-shadow-2xl text-5xl sm:text-7xl font-extrabold tracking-tight text-center text-white mt-8 duration-500 ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
          >
            A{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
              space
            </span>{" "}
            for coders
          </h1>
          <div className="flex justify-center mt-12">
            <button
              className="border-2 rounded-full p-4 animate-bounce bg-neutral-900 bg-opacity-60"
              onClick={() => handleScroll("cta")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="#ffffff"
                className="w-8 h-8"
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
          className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-black"
          data-atropos-offset="-2"
        />
        <div
          className="absolute top-0 w-full h-20 bg-gradient-to-b from-black"
          data-atropos-offset="-2"
        />
      </Atropos>
    </main>
  );
}
