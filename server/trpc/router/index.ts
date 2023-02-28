import { router } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";

export const appRouter = router({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  notification: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
