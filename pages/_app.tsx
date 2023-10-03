import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import AuthProvider from "./context/AuthProvider";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import ProgressBar from "../components/ProgressBar/ProgressBar";
import Providers from "../components/Theme/ThemeProvider";
// import 'material-icons/iconfont/material-icons.css';

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
        includedDomains: ["codu.co", "www.codu.co"],
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
    <Providers>
    <AuthProvider>
      <ProgressBar isAnimating={isAnimating} />
      <Component {...pageProps} />
    </AuthProvider>
  </Providers>
  );
}

export default trpc.withTRPC(MyApp);
