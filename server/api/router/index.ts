import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";
import { reportRouter } from "./report";

export const appRouter = createTRPCRouter({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  notification: notificationRouter,
  admin: adminRouter,
  report: reportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
