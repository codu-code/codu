import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { discussionRouter } from "./discussion";

import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";
import { reportRouter } from "./report";
import { tagRouter } from "./tag";
import { feedRouter } from "./feed";
import { contentRouter } from "./content";

export const appRouter = createTRPCRouter({
  post: postRouter,
  profile: profileRouter,
  comment: commentRouter,
  discussion: discussionRouter,
  notification: notificationRouter,
  admin: adminRouter,
  report: reportRouter,
  tag: tagRouter,
  feed: feedRouter,
  content: contentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
