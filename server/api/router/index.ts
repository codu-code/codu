import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";
import { emailReportRouter } from "./emailReport";

export const appRouter = createTRPCRouter({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  notification: notificationRouter,
  admin: adminRouter,
  emailReport: emailReportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
