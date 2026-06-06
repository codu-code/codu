import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
import { commentRouter } from "./comment";
import { notificationRouter } from "./notification";
import { adminRouter } from "./admin";
import { reportRouter } from "./report";
import { tagRouter } from "./tag";
import { feedRouter } from "./feed";
import { sponsorRouter } from "./sponsor";
import { volunteerRouter } from "./volunteer";
import { speakerRouter } from "./speaker";
import { jobRouter } from "./job";
import { engagementRouter } from "./engagement";

// Legacy routers (kept for backward compatibility during migration)
import { discussionRouter } from "./discussion";
import { contentRouter } from "./content";

export const appRouter = createTRPCRouter({
  // Primary routers (using new schema)
  post: postRouter,
  comment: commentRouter,
  profile: profileRouter,
  notification: notificationRouter,
  admin: adminRouter,
  report: reportRouter,
  tag: tagRouter,
  feed: feedRouter,
  sponsor: sponsorRouter,
  volunteer: volunteerRouter,
  speaker: speakerRouter,
  job: jobRouter,
  engagement: engagementRouter,

  // Legacy routers (for backward compatibility)
  // TODO: Remove once all frontend is migrated
  discussion: discussionRouter,
  content: contentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
