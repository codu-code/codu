"use client";

import React, { useState, useEffect } from "react";

const CoduLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="463"
      height="150"
      fill="none"
      viewBox="0 0 463 150"
      className={className}
      aria-label="Codú logo"
      role="img"
    >
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M187 150a50 50 0 1 0 0-100 50 50 0 0 0 0 100Zm0-18a32 32 0 1 0 0-64 32 32 0 0 0 0 64Z"
        clipRule="evenodd"
      />
      <path
        fill="#fff"
        d="M415.75 6.36a9 9 0 0 1 12.73 12.73l-18.39 18.39a9 9 0 0 1-12.73-12.73l18.39-18.39Z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M341 0a9 9 0 0 0-9 9v52.58A50 50 0 1 0 350 100V9a9 9 0 0 0-9-9Zm-9 100a32 32 0 1 0-64 0 32 32 0 0 0 64 0Z"
        clipRule="evenodd"
      />
      <path
        fill="#fff"
        d="M121.46 121.88c3.5 3.53 3.5 9.28-.42 12.33a75 75 0 1 1-.05-118.45c3.93 3.05 3.93 8.8.44 12.33-3.5 3.53-9.17 3.5-13.2.6a57 57 0 1 0 .03 92.6c4.04-2.9 9.7-2.94 13.2.59ZM363 59a9 9 0 1 1 18 0v41a32 32 0 0 0 64 0V59a9 9 0 1 1 18 0v82a9 9 0 1 1-18 0v-2.58A50 50 0 0 1 363 100V59Z"
      />
    </svg>
  );
};

const NightSky = () => {
  const styles = `
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }
    @keyframes gentleMove1 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(3px, 2px); }
    }
    @keyframes gentleMove2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-2px, 4px); }
    }
    @keyframes gentleMove3 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(4px, -3px); }
    }
    @keyframes shootingStar {
      0% { transform: translate(0, 0); opacity: 1; }
      100% { transform: translate(300px, 300px); opacity: 0; }
    }
    .twinkle { animation: twinkle 4s ease-in-out infinite; }
    .gentle-move1 { animation: gentleMove1 25s ease-in-out infinite; }
    .gentle-move2 { animation: gentleMove2 30s ease-in-out infinite; }
    .gentle-move3 { animation: gentleMove3 35s ease-in-out infinite; }
    .shooting-star {
      position: absolute;
      width: 4px;
      height: 4px;
      background: white;
      border-radius: 50%;
      top: -4px;
      left: -4px;
      animation: shootingStar 1.5s linear;
      animation-iteration-count: 1;
    }
  `;

  const [shootingStars, setShootingStars] = useState<number[]>([]);
  useEffect(() => {
    const createShootingStar = () => {
      const id = Date.now();
      setShootingStars((prev) => [...prev, id]);
      setTimeout(() => {
        setShootingStars((prev) => prev.filter((starId) => starId !== id));
      }, 1500); // Match the duration of the shooting star animation
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        // 30% chance every 3 seconds
        createShootingStar();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const starPositions = [
    { x: 10, y: 15 },
    { x: 25, y: 30 },
    { x: 40, y: 10 },
    { x: 60, y: 40 },
    { x: 75, y: 20 },
    { x: 5, y: 50 },
    { x: 30, y: 70 },
    { x: 50, y: 85 },
    { x: 80, y: 60 },
    { x: 90, y: 35 },
    { x: 15, y: 25 },
    { x: 35, y: 45 },
    { x: 55, y: 15 },
    { x: 70, y: 55 },
    { x: 85, y: 30 },
    { x: 20, y: 65 },
    { x: 45, y: 80 },
    { x: 65, y: 5 },
    { x: 95, y: 45 },
    { x: 8, y: 90 },
    { x: 28, y: 18 },
    { x: 48, y: 38 },
    { x: 68, y: 78 },
    { x: 88, y: 22 },
    { x: 12, y: 72 },
    { x: 32, y: 92 },
    { x: 52, y: 62 },
    { x: 72, y: 42 },
    { x: 92, y: 82 },
    { x: 18, y: 52 },
    { x: 38, y: 32 },
    { x: 58, y: 72 },
    { x: 78, y: 12 },
    { x: 98, y: 58 },
    { x: 3, y: 83 },
    { x: 23, y: 3 },
    { x: 43, y: 93 },
    { x: 63, y: 33 },
    { x: 83, y: 73 },
    { x: 7, y: 37 },
  ];

  const seededRandom = (function () {
    const seed = 12345; // You can change this seed to get a different, but consistent, pattern
    let state = seed;
    return function () {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  })();

  const generateStars = () => {
    return starPositions.map((pos, i) => (
      <circle
        key={i}
        cx={pos.x}
        cy={pos.y}
        r={seededRandom() * 0.15 + 0.05}
        fill="white"
        opacity={seededRandom() * 0.5 + 0.3}
        className={seededRandom() > 0.7 ? "twinkle" : ""}
      />
    ));
  };

  const generateAnimatedStars = () => {
    const animatedStarPositions = [
      { x: 20, y: 20 },
      { x: 45, y: 55 },
      { x: 70, y: 30 },
      { x: 85, y: 75 },
      { x: 15, y: 80 },
      { x: 55, y: 25 },
      { x: 35, y: 65 },
      { x: 65, y: 50 },
      { x: 10, y: 40 },
      { x: 90, y: 10 },
    ];
    return animatedStarPositions.map((pos, i) => (
      <circle
        key={`animated-${i}`}
        cx={pos.x}
        cy={pos.y}
        r={seededRandom() * 0.2 + 0.1}
        fill="white"
        opacity={seededRandom() * 0.5 + 0.5}
        className={`gentle-move${(i % 3) + 1}`}
      />
    ));
  };

  return (
    <div className="night-sky-container relative h-full w-full">
      <style>{styles}</style>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ background: "transparent", width: "100%", height: "100%" }}
        className="absolute inset-0"
      >
        {generateStars()}
        {generateAnimatedStars()}
      </svg>
      {shootingStars.map((id) => (
        <div key={id} className="shooting-star" />
      ))}
    </div>
  );
};

export default function Hero() {
  return (
    <div className="relative w-full bg-neutral-950">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
      <section
        className="relative mx-auto h-[500px] max-w-5xl overflow-hidden rounded sm:h-[600px]"
        aria-labelledby="hero-heading"
      >
        <NightSky />
        <div className="absolute left-1/2 top-1/2 z-10 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 transform space-y-4 px-4 text-center sm:px-6 lg:px-8">
          <CoduLogo className="mx-auto mb-8 h-16 sm:h-20" aria-hidden="true" />
          <h1
            id="hero-heading"
            className="text-2xl font-semibold text-white sm:text-4xl md:text-4xl"
          >
            The <span className="font-extrabold text-pink-600">free</span> web
            developer community
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-neutral-300 sm:text-base md:text-lg">
            {`Codú's community offers hundreds of tutorials, an online community, and answers 
              questions on a wide range of web development topics. Sign up for a free account today
            and join the community.`}
          </p>
        </div>
      </section>
    </div>
  );
}
