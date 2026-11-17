import { createTRPCRouter } from "../trpc";
import { postRouter } from "./post";
import { profileRouter } from "./profile";
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
import { followRouter } from "./follow";
import { publicationRouter } from "./publication";
import { searchRouter } from "./search";
import { discussionRouter } from "./discussion";
import { contentRouter } from "./content";

export const appRouter = createTRPCRouter({
  post: postRouter,
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
  follow: followRouter,
  publication: publicationRouter,
  search: searchRouter,

  // `discussion` is the comments router; `content` serves the feed and post
  // authoring. Like `post`, both use the `posts`/`comments` tables.
  discussion: discussionRouter,
  content: contentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
