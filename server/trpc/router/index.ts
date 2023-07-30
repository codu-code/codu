import { router } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";

export const appRouter = router({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  notification: notificationRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
