"use client";
import HolyLoader from "holy-loader";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { done as _done } from "nprogress";

const ProgressBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    _done(true);
  }, [pathname, searchParams]);

  return (
    <HolyLoader
      easing="linear"
      color="linear-gradient(
        to right,
        rgb(251, 146, 60),
        rgb(219, 39, 119)
      )"
      zIndex={50}
      height="0.25rem"
    />
  );
};

export default ProgressBar;
