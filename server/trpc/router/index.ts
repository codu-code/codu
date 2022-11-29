import { router } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";

export const appRouter = router({
  post: postRouter,
  profile: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
