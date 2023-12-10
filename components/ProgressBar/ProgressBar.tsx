"use client";
import NextTopLoader from "nextjs-toploader";
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
    <NextTopLoader
      easing="linear"
      showSpinner={false}
      template='<div class="bar" role="bar"><div class="gradient"></div></div>'
    />
  );
};

export default ProgressBar;
