"use client";

import { load, trackPageview } from "fathom-client";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load the Fathom script on mount
  useEffect(() => {
    const env = process.env.NODE_ENV;
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

    if (env !== "production" || !siteId) return;

    load(siteId, {
      includedDomains: ["www.codu.co", "codu.co"],
      auto: false,
    });
  }, []);

  // Record a pageview when route changes
  useEffect(() => {
    const env = process.env.NODE_ENV;
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

    if (env !== "production" || !siteId || !pathname) return;

    trackPageview({
      url: pathname + (searchParams ? searchParams.toString() : ""),
      referrer: document.referrer,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function Fathom() {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}
