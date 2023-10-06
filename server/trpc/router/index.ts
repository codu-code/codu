import { router } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";
import { sendEmailRouter } from "./sendEmail";

export const appRouter = router({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  notification: notificationRouter,
  admin: adminRouter,
  sendEmail: sendEmailRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
