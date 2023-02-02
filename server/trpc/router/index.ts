import { router } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";

export const appRouter = router({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
