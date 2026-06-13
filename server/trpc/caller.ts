import { headers } from "next/headers";

import { appRouter } from "@/server/api/router";
import { createInnerTRPCContext } from "@/server/api/trpc";

/**
 * Direct server-side tRPC caller for RSC data fetching — invokes procedures
 * in-process instead of HTTP self-fetching /api/trpc (which breaks behind
 * preview deployment protection and adds a network hop).
 */
export async function serverApi() {
  const ctx = await createInnerTRPCContext({ headers: await headers() });
  return appRouter.createCaller(ctx);
}
