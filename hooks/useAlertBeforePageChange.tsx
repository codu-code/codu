import Router from "next/router";
import { useEffect } from "react";

export const useAlertBeforePageChange = (
  shouldAlert: boolean,
  callback: () => boolean
) => {
  useEffect(() => {
    if (shouldAlert) {
      const routeChangeStart = () => {
        const ok = callback();
        if (!ok) {
          Router.events.emit("routeChangeError");
          throw "Abort route change. Please ignore this error.";
        }
      };
      Router.events.on("routeChangeStart", routeChangeStart);

      return () => {
        Router.events.off("routeChangeStart", routeChangeStart);
      };
    }
  }, [shouldAlert, callback]);
};
