import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const env = process.env.NODE_ENV;
    const siteId = process.env.NEXT_PUBLIC_FATHOM_SITE_ID;

    if (env !== "production" || !siteId) return;

    Fathom.load(siteId, {
      includedDomains: ["codu.co"],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
    };
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
