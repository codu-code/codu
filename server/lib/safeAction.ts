import "server-only";

import { createSafeActionClient } from "next-safe-action";
import { getServerAuthSession } from "@/server/auth";
export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    throw new Error("Session invalid.");
  }

  return next({ ctx: { user: session.user } });
});
