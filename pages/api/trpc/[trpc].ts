import * as trpcNext from "@trpc/server/adapters/next";
import { createContext } from "../../../server/trpc/context";
import { appRouter } from "../../../server/trpc/router";
import type { AppRouter } from "../../../server/trpc/router";

export default trpcNext.createNextApiHandler<AppRouter>({
  router: appRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
  /**
   * Data transformer
   * @link https://trpc.io/docs/data-transformers
   */

  /**
   * @link https://trpc.io/docs/error-handling
   */
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      // send to bug reporting
      console.error("Something went wrong", error);
    }
  },
  /**
   * Enable query batching
   */
  batching: {
    enabled: true,
  },
});
