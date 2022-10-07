import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { withTRPC } from "@trpc/next";
import superjson from "superjson";
import { AppRouter } from "../server/trpc/router";
import ProgressBar from "../components/ProgressBar/ProgressBar";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  useEffect(() => {
    const env = process.env.NODE_ENV;
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

    if (env !== "production" || !siteId) return;

    Fathom.load(siteId, {
      includedDomains: ["codu.co"],
    });

    function onRouteChangeStart() {
      setIsAnimating(true);
    }

    function onRouteChangeComplete() {
      setIsAnimating(false);
      Fathom.trackPageview();
    }

    router.events.on("routeChangeStart", onRouteChangeStart);
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, [router]);

  useEffect(() => {
    const env = process.env.NODE_ENV;
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

    const enableAnalytics = env === "production" && siteId;

    if (enableAnalytics) {
      Fathom.load(siteId, {
        includedDomains: ["codu.co"],
      });
    }

    function onRouteChangeStart() {
      setIsAnimating(true);
    }

    function onRouteChangeComplete() {
      setIsAnimating(false);
      if (enableAnalytics) {
        Fathom.trackPageview();
      }
    }

    router.events.on("routeChangeStart", onRouteChangeStart);
    router.events.on("routeChangeError", onRouteChangeComplete);
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);
    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
      router.events.off("routeChangeStart", onRouteChangeStart);
      router.events.off("routeChangeError", onRouteChangeComplete);
    };
  }, [router]);

  return (
    <SessionProvider session={pageProps.session}>
      <ProgressBar isAnimating={isAnimating} />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default withTRPC<AppRouter>({
  config() {
    return {
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    };
  },
  ssr: false,
})(MyApp);
