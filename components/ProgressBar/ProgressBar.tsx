"use client";

//@TODO fix this!

import { useNProgress } from "@tanem/react-nprogress";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ProgressBar = () => {
  const router = useRouter();

  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating,
  });

  useEffect(() => {
    function onRouteChangeStart() {
      setIsAnimating(true);
    }

    function onRouteChangeComplete() {
      setIsAnimating(false);
    }

    router.events.on("routeChangeStart", onRouteChangeStart);
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, [router]);

  return (
    <div
      className="pointer-events-none"
      style={{
        opacity: isFinished ? 0 : 1,
        transition: `opacity ${animationDuration}ms linear`,
      }}
    >
      <div
        className="bg-gradient-to-r from-orange-400 to-pink-600 h-1 w-full left-0 top-0 fixed z-50"
        style={{
          marginLeft: `${(-1 + progress) * 100}%`,
          transition: `margin-left ${animationDuration}ms linear`,
        }}
      />
    </div>
  );
};

export default ProgressBar;
