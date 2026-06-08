import crypto from "crypto";
import {
  timestamp,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  serial,
  foreignKey,
  boolean,
  primaryKey,
  varchar,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";
import { type AdapterAccount } from "next-auth/adapters";

// ENUMS - Lowercase values

export const role = pgEnum("Role", ["MODERATOR", "ADMIN", "USER"]);

// New lowercase enums for posts/comments system
export const postType = pgEnum("post_type", [
  "article",
  "discussion",
  "link",
  "resource",
  // Relaunch low-bar contribution kinds (handoff): TIL = "today I learned"
  // tips, question = ask-the-community posts.
  "til",
  "question",
]);
export const postStatus = pgEnum("post_status", [
  "draft",
  "published",
  "scheduled",
  "unlisted",
  // Auto-moderation flow (gated behind MODERATION_ENABLED): a post submitted
  // by its author sits in `in_review` until an admin approves (→ published) or
  // rejects (→ rejected).
  "in_review",
  "rejected",
]);
export const voteType = pgEnum("vote_type", ["up", "down"]);
export const feedSourceStatus = pgEnum("feed_source_status", [
  "active",
  "paused",
  "error",
]);
export const reportReason = pgEnum("report_reason", [
  "spam",
  "harassment",
  "hate_speech",
  "misinformation",
  "copyright",
  "nsfw",
  "off_topic",
  "other",
]);
export const reportStatus = pgEnum("report_status", [
  "pending",
  "reviewed",
  "dismissed",
  "actioned",
]);

// Job board
export const jobType = pgEnum("job_type", [
  "full-time",
  "part-time",
  "freelancer",
  "other",
]);
// Lifecycle: draft -> pending_payment -> pending (paid, awaiting moderation)
// -> active -> expired. rejected is terminal.
export const jobStatus = pgEnum("job_status", [
  "draft",
  "pending_payment",
  "pending",
  "active",
  "expired",
  "rejected",
]);

// Engagement / Build Board
export const pointAction = pgEnum("point_action", [
  "post_published",
  "comment_created",
  "upvote_received",
  "daily_active",
  "shipped",
  "referral",
]);

// Legacy enums (kept for backward compatibility during migration)
export const legacyVoteType = pgEnum("VoteType", ["UP", "DOWN"]);

// USER & AUTH TABLES

export const session = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const user = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: varchar("username", { length: 40 }),
    name: text("name").default("").notNull(),
    email: text("email"),
    emailVerified: timestamp("emailVerified", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    image: text("image").default("/images/person.png").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .$onUpdate(() => new Date().toISOString())
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    bio: varchar("bio", { length: 200 }).default("").notNull(),
    location: text("location").default("").notNull(),
    websiteUrl: text("websiteUrl").default("").notNull(),
    emailNotifications: boolean("emailNotifications").default(true).notNull(),
    newsletter: boolean("newsletter").default(true).notNull(),
    gender: text("gender"),
    dateOfBirth: timestamp("dateOfBirth", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    professionalOrStudent: text("professionalOrStudent"),
    workplace: text("workplace"),
    jobTitle: text("jobTitle"),
    levelOfStudy: text("levelOfStudy"),
    course: text("course"),
    role: role("role").default("USER").notNull(),
    // Referral loop
    referralCode: varchar("referral_code", { length: 16 }),
    invitedBy: text("invited_by"),
    // Relaunch onboarding: chosen topics ("Your topics") that tune the feed.
    topics: text("topics")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    // Experience level + focus captured in onboarding (free-form keys).
    experienceLevel: text("experience_level"),
    onboardedAt: timestamp("onboarded_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
  },
  (table) => {
    return {
      usernameKey: uniqueIndex("User_username_key").on(table.username),
      emailKey: uniqueIndex("User_email_key").on(table.email),
      usernameIdIdx: index("User_username_id_idx").on(table.id, table.username),
      usernameIndex: index("User_username_index").on(table.username),
      referralCodeKey: uniqueIndex("User_referral_code_key").on(
        table.referralCode,
      ),
      invitedByIdx: index("User_invited_by_idx").on(table.invitedBy),
    };
  },
);

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account),
  bans: many(banned_users, { relationName: "bans" }),
  bannedUsers: one(banned_users, {
    fields: [user.id],
    references: [banned_users.userId],
  }),
  sessions: many(session),
  emailChangeRequests: many(emailChangeRequest),
  emailChangeHistory: many(emailChangeHistory),
  // New posts/comments relations
  posts: many(posts),
  comments: many(comments),
  postVotes: many(post_votes),
  commentVotes: many(comment_votes),
  bookmarks: many(bookmarks),
  reportsMade: many(reports, { relationName: "reportsMade" }),
  reportsReviewed: many(reports, { relationName: "reportsReviewed" }),
  // Feed sources owned by this user (RSS source profiles)
  feedSources: many(feed_sources),
  // Legacy relations (kept for backward compatibility)
  legacyPosts: many(post),
  legacyComments: many(comment),
  legacyBookmarks: many(bookmark),
  legacyLikes: many(like),
  legacyPostVotes: many(post_vote),
  flaggedByUser: many(flagged, { relationName: "flaggedByUser" }),
  flaggedContent: many(flagged, { relationName: "flaggedContent" }),
  notificationsCreated: many(notification, {
    relationName: "notificationsCreated",
  }),
  notificationsReceived: many(notification, {
    relationName: "notificationsReceived",
  }),
}));

// FEED SOURCES (RSS)

export const feed_sources = pgTable(
  "feed_sources",
  {
    id: serial("id").primaryKey().notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    slug: varchar("slug", { length: 100 }),
    category: varchar("category", { length: 50 }),
    description: text("description"),
    status: feedSourceStatus("status").default("active").notNull(),
    // User profile linked to this feed source (serves as author for aggregated articles)
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    lastFetchedAt: timestamp("last_fetched_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    lastSuccessAt: timestamp("last_success_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    errorCount: integer("error_count").default(0).notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    urlKey: uniqueIndex("feed_sources_url_key").on(table.url),
    slugKey: uniqueIndex("feed_sources_slug_key").on(table.slug),
    userIdIdx: index("feed_sources_user_id_idx").on(table.userId),
  }),
);

export const feedSourcesRelations = relations(
  feed_sources,
  ({ one, many }) => ({
    user: one(user, { fields: [feed_sources.userId], references: [user.id] }),
    posts: many(posts),
  }),
);

// POSTS TABLE

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: postType("type").notNull(),

    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    canonicalUrl: text("canonical_url"),
    coverImage: text("cover_image"),

    // For link/resource types (external URLs)
    externalUrl: varchar("external_url", { length: 2000 }),

    // RSS import metadata
    sourceId: integer("source_id").references(() => feed_sources.id, {
      onDelete: "set null",
    }),
    sourceAuthor: varchar("source_author", { length: 200 }),

    // Metadata
    readingTime: integer("reading_time"),

    // Denormalized counters (updated via triggers)
    upvotesCount: integer("upvotes_count").default(0).notNull(),
    downvotesCount: integer("downvotes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    viewsCount: integer("views_count").default(0).notNull(),

    // Publishing
    status: postStatus("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),

    // Feature flags
    featured: boolean("featured").default(false).notNull(),
    pinnedUntil: timestamp("pinned_until", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    showComments: boolean("show_comments").default(true).notNull(),

    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),

    // Migration tracking: references legacy Post.id
    legacyPostId: text("legacy_post_id"),
  },
  (table) => ({
    authorIdIdx: index("posts_author_id_idx").on(table.authorId),
    slugKey: uniqueIndex("posts_slug_idx").on(table.slug),
    legacyPostIdIdx: uniqueIndex("posts_legacy_post_id_idx").on(
      table.legacyPostId,
    ),
    statusIdx: index("posts_status_idx").on(table.status),
    publishedAtIdx: index("posts_published_at_idx").on(table.publishedAt),
    typeIdx: index("posts_type_idx").on(table.type),
    sourceIdIdx: index("posts_source_id_idx").on(table.sourceId),
    featuredIdx: index("posts_featured_idx").on(table.featured),
  }),
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(user, { fields: [posts.authorId], references: [user.id] }),
  source: one(feed_sources, {
    fields: [posts.sourceId],
    references: [feed_sources.id],
  }),
  comments: many(comments),
  votes: many(post_votes),
  bookmarks: many(bookmarks),
  tags: many(post_tags),
  reports: many(reports),
}));

// COMMENTS TABLE

export const comments = pgTable(
  "comments",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),

    // Materialized path for efficient tree queries (stored as text, ltree in DB)
    path: text("path").notNull(),
    depth: integer("depth").default(0).notNull(),

    body: text("body").notNull(),

    // Denormalized counters
    upvotesCount: integer("upvotes_count").default(0).notNull(),
    downvotesCount: integer("downvotes_count").default(0).notNull(),

    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    deletedAt: timestamp("deleted_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }), // Soft delete for "[deleted]" placeholders

    // Migration tracking: references legacy Comment.id
    legacyCommentId: integer("legacy_comment_id"),
  },
  (table) => ({
    postIdIdx: index("comments_post_id_idx").on(table.postId),
    authorIdIdx: index("comments_author_id_idx").on(table.authorId),
    parentIdIdx: index("comments_parent_id_idx").on(table.parentId),
    createdAtIdx: index("comments_created_at_idx").on(table.createdAt),
    legacyCommentIdIdx: uniqueIndex("comments_legacy_comment_id_idx").on(
      table.legacyCommentId,
    ),
    commentParentIdFkey: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "comments_parent_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  }),
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(user, { fields: [comments.authorId], references: [user.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  children: many(comments, { relationName: "commentReplies" }),
  votes: many(comment_votes),
  reports: many(reports),
}));

// POST VOTES

export const post_votes = pgTable(
  "post_votes",
  {
    id: serial("id").primaryKey().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    voteType: voteType("vote_type").notNull(),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("post_votes_post_id_user_id_key").on(
      table.postId,
      table.userId,
    ),
    postIdIdx: index("post_votes_post_id_idx").on(table.postId),
  }),
);

export const postVotesRelations = relations(post_votes, ({ one }) => ({
  post: one(posts, { fields: [post_votes.postId], references: [posts.id] }),
  user: one(user, { fields: [post_votes.userId], references: [user.id] }),
}));

// COMMENT VOTES

export const comment_votes = pgTable(
  "comment_votes",
  {
    id: serial("id").primaryKey().notNull(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    voteType: voteType("vote_type").notNull(),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("comment_votes_comment_id_user_id_key").on(
      table.commentId,
      table.userId,
    ),
    commentIdIdx: index("comment_votes_comment_id_idx").on(table.commentId),
  }),
);

export const commentVotesRelations = relations(comment_votes, ({ one }) => ({
  comment: one(comments, {
    fields: [comment_votes.commentId],
    references: [comments.id],
  }),
  user: one(user, { fields: [comment_votes.userId], references: [user.id] }),
}));

// BOOKMARKS

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueBookmark: unique("bookmarks_post_id_user_id_key").on(
      table.postId,
      table.userId,
    ),
    userIdIdx: index("bookmarks_user_id_idx").on(table.userId),
    postIdIdx: index("bookmarks_post_id_idx").on(table.postId),
  }),
);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  post: one(posts, { fields: [bookmarks.postId], references: [posts.id] }),
  user: one(user, { fields: [bookmarks.userId], references: [user.id] }),
}));

// POST TAGS

export const post_tags = pgTable(
  "post_tags",
  {
    id: serial("id").primaryKey().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePostTag: unique("post_tags_post_id_tag_id_key").on(
      table.postId,
      table.tagId,
    ),
    postIdIdx: index("post_tags_post_id_idx").on(table.postId),
    tagIdIdx: index("post_tags_tag_id_idx").on(table.tagId),
  }),
);

export const postTagsRelations = relations(post_tags, ({ one }) => ({
  post: one(posts, { fields: [post_tags.postId], references: [posts.id] }),
  tag: one(tag, { fields: [post_tags.tagId], references: [tag.id] }),
}));

// REPORTS

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey().notNull(),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: reportReason("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").default("pending").notNull(),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    actionTaken: text("action_taken"),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    statusIdx: index("reports_status_idx").on(table.status),
    reporterIdIdx: index("reports_reporter_id_idx").on(table.reporterId),
    postIdIdx: index("reports_post_id_idx").on(table.postId),
    commentIdIdx: index("reports_comment_id_idx").on(table.commentId),
  }),
);

export const reportsRelations = relations(reports, ({ one }) => ({
  post: one(posts, { fields: [reports.postId], references: [posts.id] }),
  comment: one(comments, {
    fields: [reports.commentId],
    references: [comments.id],
  }),
  reporter: one(user, {
    fields: [reports.reporterId],
    references: [user.id],
    relationName: "reportsMade",
  }),
  reviewedBy: one(user, {
    fields: [reports.reviewedById],
    references: [user.id],
    relationName: "reportsReviewed",
  }),
}));

// TAGS (shared between legacy and new system)

export const tag = pgTable(
  "Tag",
  {
    id: serial("id").primaryKey().notNull().unique(),
    title: varchar("title", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 50 }),
    description: text("description"),
    postCount: integer("post_count").default(0).notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      titleKey: uniqueIndex("Tag_title_key").on(table.title),
      slugKey: uniqueIndex("Tag_slug_key").on(table.slug),
    };
  },
);

export const tagRelations = relations(tag, ({ many }) => ({
  postTags: many(post_tags),
  mergeSuggestionsAsSource: many(tag_merge_suggestions, {
    relationName: "sourceTag",
  }),
  mergeSuggestionsAsTarget: many(tag_merge_suggestions, {
    relationName: "targetTag",
  }),
  // Legacy
  legacyPostTag: many(post_tag),
  legacyContentTag: many(content_tag),
}));

// TAG MERGE SUGGESTIONS (for AI-powered tag cleanup)

export const tagMergeSuggestionStatus = pgEnum("tag_merge_suggestion_status", [
  "pending",
  "approved",
  "rejected",
]);

export const tag_merge_suggestions = pgTable(
  "tag_merge_suggestions",
  {
    id: serial("id").primaryKey().notNull(),
    sourceTagId: integer("source_tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    targetTagId: integer("target_tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    similarityScore: integer("similarity_score").notNull(), // 0-100
    reason: text("reason"),
    status: tagMergeSuggestionStatus("status").default("pending").notNull(),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    sourceTagIdx: index("tag_merge_suggestions_source_tag_idx").on(
      table.sourceTagId,
    ),
    targetTagIdx: index("tag_merge_suggestions_target_tag_idx").on(
      table.targetTagId,
    ),
    statusIdx: index("tag_merge_suggestions_status_idx").on(table.status),
    uniqueSuggestion: unique("tag_merge_suggestions_source_target_key").on(
      table.sourceTagId,
      table.targetTagId,
    ),
  }),
);

export const tagMergeSuggestionsRelations = relations(
  tag_merge_suggestions,
  ({ one }) => ({
    sourceTag: one(tag, {
      fields: [tag_merge_suggestions.sourceTagId],
      references: [tag.id],
      relationName: "sourceTag",
    }),
    targetTag: one(tag, {
      fields: [tag_merge_suggestions.targetTagId],
      references: [tag.id],
      relationName: "targetTag",
    }),
    reviewedBy: one(user, {
      fields: [tag_merge_suggestions.reviewedById],
      references: [user.id],
    }),
  }),
);

// SPONSOR INQUIRY

export const sponsorInquiryStatus = pgEnum("SponsorInquiryStatus", [
  "PENDING",
  "CONTACTED",
  "CONVERTED",
  "CLOSED",
]);

export const sponsorBudgetRange = pgEnum("SponsorBudgetRange", [
  "EXPLORING",
  "UNDER_500",
  "BETWEEN_500_2000",
  "BETWEEN_2000_5000",
  "OVER_5000",
]);

export const sponsor_inquiry = pgTable(
  "SponsorInquiry",
  {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    company: varchar("company", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    interests: text("interests"),
    budgetRange: sponsorBudgetRange("budgetRange").default("EXPLORING"),
    goals: text("goals"),
    status: sponsorInquiryStatus("status").default("PENDING").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    statusIndex: index("SponsorInquiry_status_index").on(table.status),
    emailIndex: index("SponsorInquiry_email_index").on(table.email),
  }),
);

// EMAIL CHANGE TABLES

export const emailChangeRequest = pgTable("EmailChangeRequest", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  newEmail: text("newEmail").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export const emailChangeRequestRelations = relations(
  emailChangeRequest,
  ({ one }) => ({
    user: one(user, {
      fields: [emailChangeRequest.userId],
      references: [user.id],
    }),
  }),
);

export const emailChangeHistory = pgTable("EmailChangeHistory", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  oldEmail: text("oldEmail").notNull(),
  newEmail: text("newEmail").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
});

export const emailChangeHistoryRelations = relations(
  emailChangeHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [emailChangeHistory.userId],
      references: [user.id],
    }),
  }),
);

// BANNED USERS

export const banned_users = pgTable(
  "BannedUsers",
  {
    id: serial("id").primaryKey().notNull().unique(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    bannedById: text("bannedById")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    note: text("note"),
  },
  (table) => {
    return {
      userIdKey: uniqueIndex("BannedUsers_userId_key").on(table.userId),
    };
  },
);

export const banned_usersRelations = relations(banned_users, ({ one }) => ({
  bannedBy: one(user, {
    fields: [banned_users.bannedById],
    references: [user.id],
    relationName: "bans",
  }),
  user: one(user, {
    fields: [banned_users.userId],
    references: [user.id],
  }),
}));

// NOTIFICATION

export const notification = pgTable(
  "Notification",
  {
    id: serial("id").primaryKey().notNull().unique(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    type: integer("type").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: uuid("postId").references(() => posts.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    commentId: uuid("commentId").references(() => comments.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    notifierId: text("notifierId").references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => {
    return {
      userIdIndex: index("Notification_userId_index").on(table.userId),
    };
  },
);

export const notificationRelations = relations(notification, ({ one }) => ({
  comment: one(comments, {
    fields: [notification.commentId],
    references: [comments.id],
  }),
  notifier: one(user, {
    fields: [notification.notifierId],
    references: [user.id],
    relationName: "notificationsCreated",
  }),
  post: one(posts, { fields: [notification.postId], references: [posts.id] }),
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
    relationName: "notificationsReceived",
  }),
}));

// LEGACY TABLES (kept for backward compatibility during migration)
// These tables are preserved from the old schema.
// After migration verification, they can be removed.

export const post_tag = pgTable(
  "PostTag",
  {
    id: serial("id").primaryKey().notNull(),
    tagId: integer("tagId")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      tagIdPostIdKey: uniqueIndex("PostTag_tagId_postId_key").on(
        table.tagId,
        table.postId,
      ),
    };
  },
);

export const post_tagRelations = relations(post_tag, ({ one }) => ({
  post: one(post, { fields: [post_tag.postId], references: [post.id] }),
  tag: one(tag, { fields: [post_tag.tagId], references: [tag.id] }),
}));

export const post = pgTable(
  "Post",
  {
    id: text("id").notNull().unique(),
    title: text("title").notNull(),
    canonicalUrl: text("canonicalUrl"),
    coverImage: text("coverImage"),
    approved: boolean("approved").default(true).notNull(),
    body: text("body").notNull(),
    excerpt: varchar("excerpt", { length: 156 }).default("").notNull(),
    readTimeMins: integer("readTimeMins").notNull(),
    published: timestamp("published", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    slug: text("slug").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    showComments: boolean("showComments").default(true).notNull(),
    likes: integer("likes").default(0).notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Post_id_key").on(table.id),
      slugKey: uniqueIndex("Post_slug_key").on(table.slug),
      slugIndex: index("Post_slug_index").on(table.slug),
      userIdIndex: index("Post_userId_index").on(table.userId),
    };
  },
);

export const postRelations = relations(post, ({ one, many }) => ({
  bookmarks: many(bookmark),
  comments: many(comment),
  Flagged: many(flagged),
  likes: many(like),
  votes: many(post_vote),
  notifications: many(notification),
  user: one(user, { fields: [post.userId], references: [user.id] }),
  tags: many(post_tag),
}));

export const post_vote = pgTable(
  "PostVote",
  {
    id: serial("id").primaryKey().notNull(),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    voteType: legacyVoteType("voteType").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("PostVote_postId_userId_key").on(
      table.postId,
      table.userId,
    ),
    postIdIndex: index("PostVote_postId_index").on(table.postId),
  }),
);

export const postVoteRelations = relations(post_vote, ({ one }) => ({
  post: one(post, { fields: [post_vote.postId], references: [post.id] }),
  user: one(user, { fields: [post_vote.userId], references: [user.id] }),
}));

export const bookmark = pgTable(
  "Bookmark",
  {
    id: serial("id").primaryKey().notNull().unique(),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      userIdPostIdKey: uniqueIndex("Bookmark_userId_postId_key").on(
        table.postId,
        table.userId,
      ),
    };
  },
);

export const bookmarkRelations = relations(bookmark, ({ one }) => ({
  post: one(post, { fields: [bookmark.postId], references: [post.id] }),
  user: one(user, { fields: [bookmark.userId], references: [user.id] }),
}));

export const comment = pgTable(
  "Comment",
  {
    id: serial("id").primaryKey().notNull().unique(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    postId: text("postId")
      .notNull()
      .references(() => post.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    parentId: integer("parentId"),
  },
  (table) => {
    return {
      commentParentIdFkey: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "Comment_parentId_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      postIdIndex: index("Comment_postId_index").on(table.postId),
    };
  },
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "comments",
  }),
  children: many(comment, { relationName: "comments" }),
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
  Flagged: many(flagged),
  likes: many(like),
  Notification: many(notification),
}));

export const like = pgTable(
  "Like",
  {
    id: serial("id").primaryKey().notNull().unique(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postId: text("postId").references(() => post.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    commentId: integer("commentId").references(() => comment.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  },
  (table) => {
    return {
      userIdCommentIdKey: uniqueIndex("Like_userId_commentId_key").on(
        table.userId,
        table.commentId,
      ),
      userIdPostIdKey: uniqueIndex("Like_userId_postId_key").on(
        table.userId,
        table.postId,
      ),
    };
  },
);

export const likeRelations = relations(like, ({ one }) => ({
  comment: one(comment, { fields: [like.commentId], references: [comment.id] }),
  post: one(post, { fields: [like.postId], references: [post.id] }),
  user: one(user, { fields: [like.userId], references: [user.id] }),
}));

export const flagged = pgTable("Flagged", {
  id: serial("id").primaryKey().notNull().unique(),
  createdAt: timestamp("createdAt", {
    precision: 3,
    mode: "string",
    withTimezone: true,
  })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt", {
    precision: 3,
    mode: "string",
    withTimezone: true,
  })
    .notNull()
    .$onUpdate(() => new Date().toISOString())
    .default(sql`CURRENT_TIMESTAMP`),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  notifierId: text("notifierId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  note: text("note"),
  postId: text("postId").references(() => post.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  commentId: integer("commentId").references(() => comment.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const flaggedRelations = relations(flagged, ({ one }) => ({
  comment: one(comment, {
    fields: [flagged.commentId],
    references: [comment.id],
  }),
  notifier: one(user, {
    fields: [flagged.notifierId],
    references: [user.id],
    relationName: "flaggedByUser",
  }),
  post: one(post, { fields: [flagged.postId], references: [post.id] }),
  user: one(user, {
    fields: [flagged.userId],
    references: [user.id],
    relationName: "flaggedContent",
  }),
}));

// Legacy FeedSource (for backward compatibility)
export const legacyFeedSourceStatus = pgEnum("FeedSourceStatus", [
  "ACTIVE",
  "PAUSED",
  "ERROR",
]);

export const feed_source = pgTable(
  "FeedSource",
  {
    id: serial("id").primaryKey().notNull().unique(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    websiteUrl: text("websiteUrl"),
    logoUrl: text("logoUrl"),
    category: varchar("category", { length: 50 }),
    slug: varchar("slug", { length: 100 }),
    description: text("description"),
    status: legacyFeedSourceStatus("status").default("ACTIVE").notNull(),
    lastFetchedAt: timestamp("lastFetchedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    lastSuccessAt: timestamp("lastSuccessAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    errorCount: integer("errorCount").default(0).notNull(),
    lastError: text("lastError"),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => {
    return {
      urlKey: uniqueIndex("FeedSource_url_key").on(table.url),
      slugKey: uniqueIndex("FeedSource_slug_key").on(table.slug),
      statusIndex: index("FeedSource_status_index").on(table.status),
    };
  },
);

export const feedSourceRelations = relations(feed_source, ({ many }) => ({
  content: many(content),
}));

// Legacy Content table
export const legacyContentType = pgEnum("ContentType", [
  "POST",
  "LINK",
  "QUESTION",
  "VIDEO",
  "DISCUSSION",
]);

export const content = pgTable(
  "Content",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: legacyContentType("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body"),
    excerpt: text("excerpt"),
    userId: text("userId").references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    externalUrl: varchar("externalUrl", { length: 2000 }),
    imageUrl: text("imageUrl"),
    ogImageUrl: text("ogImageUrl"),
    sourceId: integer("sourceId").references(() => feed_source.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    sourceAuthor: varchar("sourceAuthor", { length: 200 }),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("publishedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    readTimeMins: integer("readTimeMins"),
    clickCount: integer("clickCount").default(0).notNull(),
    slug: varchar("slug", { length: 300 }),
    canonicalUrl: text("canonicalUrl"),
    coverImage: text("coverImage"),
    showComments: boolean("showComments").default(true).notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugKey: uniqueIndex("Content_slug_key").on(table.slug),
    typeIndex: index("Content_type_index").on(table.type),
    userIdIndex: index("Content_userId_index").on(table.userId),
    sourceIdIndex: index("Content_sourceId_index").on(table.sourceId),
    publishedAtIndex: index("Content_publishedAt_index").on(table.publishedAt),
    publishedIndex: index("Content_published_index").on(table.published),
  }),
);

export const contentRelations = relations(content, ({ one, many }) => ({
  user: one(user, { fields: [content.userId], references: [user.id] }),
  source: one(feed_source, {
    fields: [content.sourceId],
    references: [feed_source.id],
  }),
  votes: many(content_vote),
  bookmarks: many(content_bookmark),
  tags: many(content_tag),
  reports: many(content_report),
  discussions: many(discussion),
}));

export const content_vote = pgTable(
  "ContentVote",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    voteType: legacyVoteType("voteType").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("ContentVote_contentId_userId_key").on(
      table.contentId,
      table.userId,
    ),
    contentIdIndex: index("ContentVote_contentId_index").on(table.contentId),
  }),
);

export const contentVoteRelations = relations(content_vote, ({ one }) => ({
  content: one(content, {
    fields: [content_vote.contentId],
    references: [content.id],
  }),
  user: one(user, { fields: [content_vote.userId], references: [user.id] }),
}));

export const content_bookmark = pgTable(
  "ContentBookmark",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueBookmark: unique("ContentBookmark_contentId_userId_key").on(
      table.contentId,
      table.userId,
    ),
  }),
);

export const contentBookmarkRelations = relations(
  content_bookmark,
  ({ one }) => ({
    content: one(content, {
      fields: [content_bookmark.contentId],
      references: [content.id],
    }),
    user: one(user, {
      fields: [content_bookmark.userId],
      references: [user.id],
    }),
  }),
);

export const content_tag = pgTable(
  "ContentTag",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => ({
    uniqueContentTag: unique("ContentTag_contentId_tagId_key").on(
      table.contentId,
      table.tagId,
    ),
  }),
);

export const contentTagRelations = relations(content_tag, ({ one }) => ({
  content: one(content, {
    fields: [content_tag.contentId],
    references: [content.id],
  }),
  tag: one(tag, { fields: [content_tag.tagId], references: [tag.id] }),
}));

// Legacy Discussion table
export const discussion = pgTable(
  "Discussion",
  {
    id: serial("id").primaryKey().notNull().unique(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    parentId: integer("parentId"),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
  },
  (table) => ({
    discussionParentIdFkey: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "Discussion_parentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    contentIdIndex: index("Discussion_contentId_index").on(table.contentId),
    userIdIndex: index("Discussion_userId_index").on(table.userId),
  }),
);

export const discussionRelations = relations(discussion, ({ one, many }) => ({
  parent: one(discussion, {
    fields: [discussion.parentId],
    references: [discussion.id],
    relationName: "discussions",
  }),
  children: many(discussion, { relationName: "discussions" }),
  content: one(content, {
    fields: [discussion.contentId],
    references: [content.id],
  }),
  user: one(user, { fields: [discussion.userId], references: [user.id] }),
  votes: many(discussion_vote),
  reports: many(content_report),
}));

export const discussion_vote = pgTable(
  "DiscussionVote",
  {
    id: serial("id").primaryKey().notNull(),
    discussionId: integer("discussionId")
      .notNull()
      .references(() => discussion.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    voteType: legacyVoteType("voteType").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("DiscussionVote_discussionId_userId_key").on(
      table.discussionId,
      table.userId,
    ),
    discussionIdIndex: index("DiscussionVote_discussionId_index").on(
      table.discussionId,
    ),
  }),
);

export const discussionVoteRelations = relations(
  discussion_vote,
  ({ one }) => ({
    discussion: one(discussion, {
      fields: [discussion_vote.discussionId],
      references: [discussion.id],
    }),
    user: one(user, {
      fields: [discussion_vote.userId],
      references: [user.id],
    }),
  }),
);

// Legacy Content Report
export const legacyReportReason = pgEnum("ReportReason", [
  "SPAM",
  "HARASSMENT",
  "HATE_SPEECH",
  "MISINFORMATION",
  "COPYRIGHT",
  "NSFW",
  "OFF_TOPIC",
  "OTHER",
]);

export const legacyReportStatus = pgEnum("ReportStatus", [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
  "ACTIONED",
]);

export const content_report = pgTable(
  "ContentReport",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId").references(() => content.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    discussionId: integer("discussionId").references(() => discussion.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    reporterId: text("reporterId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: legacyReportReason("reason").notNull(),
    details: text("details"),
    status: legacyReportStatus("status").default("PENDING").notNull(),
    reviewedById: text("reviewedById").references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    reviewedAt: timestamp("reviewedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    actionTaken: text("actionTaken"),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    statusIndex: index("ContentReport_status_index").on(table.status),
    reporterIdIndex: index("ContentReport_reporterId_index").on(
      table.reporterId,
    ),
    contentIdIndex: index("ContentReport_contentId_index").on(table.contentId),
    discussionIdIndex: index("ContentReport_discussionId_index").on(
      table.discussionId,
    ),
  }),
);

export const contentReportRelations = relations(content_report, ({ one }) => ({
  content: one(content, {
    fields: [content_report.contentId],
    references: [content.id],
  }),
  discussion: one(discussion, {
    fields: [content_report.discussionId],
    references: [discussion.id],
  }),
  reporter: one(user, {
    fields: [content_report.reporterId],
    references: [user.id],
    relationName: "reportsMade",
  }),
  reviewedBy: one(user, {
    fields: [content_report.reviewedById],
    references: [user.id],
    relationName: "reportsReviewed",
  }),
}));

// Legacy Tables for Backward Compatibility
// (RSS Aggregated Articles - to be migrated to posts table)

// Alias exports for new tables (camelCase naming convention)
export {
  post_votes as postVotes,
  comment_votes as commentVotes,
  post_tags as postTags,
  feed_sources as feedSources,
};

export const aggregated_article = pgTable(
  "AggregatedArticle",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sourceId: integer("sourceId")
      .notNull()
      .references(() => feed_source.id),
    shortId: varchar("shortId", { length: 20 }),
    title: text("title").notNull(),
    slug: varchar("slug", { length: 350 }).notNull(),
    excerpt: text("excerpt"),
    externalUrl: varchar("externalUrl", { length: 2000 }).notNull(),
    imageUrl: text("imageUrl"),
    ogImageUrl: text("ogImageUrl"),
    sourceAuthor: varchar("sourceAuthor", { length: 200 }),
    publishedAt: timestamp("publishedAt", {
      withTimezone: true,
      mode: "string",
    }),
    fetchedAt: timestamp("fetchedAt", { withTimezone: true, mode: "string" }),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    clickCount: integer("clickCount").default(0).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("aggregated_article_source_idx").on(table.sourceId),
    index("aggregated_article_slug_idx").on(table.slug),
    index("aggregated_article_published_idx").on(table.publishedAt),
    uniqueIndex("aggregated_article_url_idx").on(table.externalUrl),
  ],
);

export const aggregatedArticleRelations = relations(
  aggregated_article,
  ({ one, many }) => ({
    source: one(feed_source, {
      fields: [aggregated_article.sourceId],
      references: [feed_source.id],
    }),
    votes: many(aggregated_article_vote),
    bookmarks: many(aggregated_article_bookmark),
    tags: many(aggregated_article_tag),
  }),
);

export const aggregated_article_vote = pgTable(
  "AggregatedArticleVote",
  {
    id: serial("id").primaryKey(),
    articleId: text("articleId")
      .notNull()
      .references(() => aggregated_article.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    voteType: legacyVoteType("voteType").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("article_vote_unique").on(table.articleId, table.userId),
    index("article_vote_article_idx").on(table.articleId),
    index("article_vote_user_idx").on(table.userId),
  ],
);

export const aggregatedArticleVoteRelations = relations(
  aggregated_article_vote,
  ({ one }) => ({
    article: one(aggregated_article, {
      fields: [aggregated_article_vote.articleId],
      references: [aggregated_article.id],
    }),
    user: one(user, {
      fields: [aggregated_article_vote.userId],
      references: [user.id],
    }),
  }),
);

export const aggregated_article_bookmark = pgTable(
  "AggregatedArticleBookmark",
  {
    id: serial("id").primaryKey(),
    articleId: text("articleId")
      .notNull()
      .references(() => aggregated_article.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("article_bookmark_unique").on(table.articleId, table.userId),
    index("article_bookmark_user_idx").on(table.userId),
  ],
);

export const aggregatedArticleBookmarkRelations = relations(
  aggregated_article_bookmark,
  ({ one }) => ({
    article: one(aggregated_article, {
      fields: [aggregated_article_bookmark.articleId],
      references: [aggregated_article.id],
    }),
    user: one(user, {
      fields: [aggregated_article_bookmark.userId],
      references: [user.id],
    }),
  }),
);

export const aggregated_article_tag = pgTable(
  "AggregatedArticleTag",
  {
    id: serial("id").primaryKey(),
    articleId: text("articleId")
      .notNull()
      .references(() => aggregated_article.id, { onDelete: "cascade" }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("article_tag_unique").on(table.articleId, table.tagId),
    index("article_tag_article_idx").on(table.articleId),
  ],
);

export const aggregatedArticleTagRelations = relations(
  aggregated_article_tag,
  ({ one }) => ({
    article: one(aggregated_article, {
      fields: [aggregated_article_tag.articleId],
      references: [aggregated_article.id],
    }),
    tag: one(tag, {
      fields: [aggregated_article_tag.tagId],
      references: [tag.id],
    }),
  }),
);

// JOB BOARD

export const job = pgTable(
  "job",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Poster relation. Keep the listing if the poster account is removed.
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    companyName: varchar("company_name", { length: 100 }).notNull(),
    companyLogo: text("company_logo"), // S3 fileLocation URL
    jobTitle: varchar("job_title", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    jobDescription: text("job_description"), // markdown
    jobLocation: varchar("job_location", { length: 60 }).notNull(),
    applicationUrl: varchar("application_url", { length: 2000 }),
    type: jobType("type").notNull(),

    // Location / perk flags
    remote: boolean("remote").default(false).notNull(),
    relocation: boolean("relocation").default(false).notNull(),
    visaSponsorship: boolean("visa_sponsorship").default(false).notNull(),

    // AI-native tagging (positioning toward AI builders)
    tags: text("tags")
      .array()
      .default(sql`ARRAY[]::text[]`)
      .notNull(),
    aiNative: boolean("ai_native").default(false).notNull(),

    // Lifecycle / monetization
    status: jobStatus("status").default("draft").notNull(),
    featured: boolean("featured").default(false).notNull(),

    // Payment hooks (provider wired later)
    priceCents: integer("price_cents"),
    currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
    paymentProvider: varchar("payment_provider", { length: 30 }),
    paymentRef: varchar("payment_ref", { length: 255 }),
    paidAt: timestamp("paid_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),

    // Moderation
    approvedById: text("approved_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    rejectionReason: text("rejection_reason"),

    // Publishing window
    publishedAt: timestamp("published_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    expiresAt: timestamp("expires_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .$onUpdate(() => new Date().toISOString())
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    slugKey: uniqueIndex("job_slug_idx").on(table.slug),
    statusIdx: index("job_status_idx").on(table.status),
    featuredIdx: index("job_featured_idx").on(table.featured),
    typeIdx: index("job_type_idx").on(table.type),
    userIdIdx: index("job_user_id_idx").on(table.userId),
    publishedAtIdx: index("job_published_at_idx").on(table.publishedAt),
    expiresAtIdx: index("job_expires_at_idx").on(table.expiresAt),
  }),
);

export const jobRelations = relations(job, ({ one }) => ({
  user: one(user, {
    fields: [job.userId],
    references: [user.id],
    relationName: "job_poster",
  }),
  approvedBy: one(user, {
    fields: [job.approvedById],
    references: [user.id],
    relationName: "job_approved_by",
  }),
}));

// ENGAGEMENT — points + streaks (Build Board)

// Append-only event log so any window (7-day, all-time) can be recomputed.
export const point_event = pgTable(
  "point_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: pointAction("action").notNull(),
    points: integer("points").notNull(),
    sourceType: varchar("source_type", { length: 30 }),
    sourceId: text("source_id"),
    // Who triggered it (e.g. the upvoter) — for distinct-user anti-gaming.
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    userIdx: index("point_event_user_idx").on(table.userId),
    userCreatedIdx: index("point_event_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    createdIdx: index("point_event_created_idx").on(table.createdAt),
    // Idempotency / anti-gaming: one award per (user, action, source, actor).
    dedupeKey: uniqueIndex("point_event_dedupe_idx").on(
      table.userId,
      table.action,
      table.sourceId,
      table.actorId,
    ),
  }),
);

export const pointEventRelations = relations(point_event, ({ one }) => ({
  user: one(user, {
    fields: [point_event.userId],
    references: [user.id],
    relationName: "point_event_user",
  }),
  actor: one(user, {
    fields: [point_event.actorId],
    references: [user.id],
    relationName: "point_event_actor",
  }),
}));

// One row per user — current daily-activity streak.
export const user_streak = pgTable("user_streak", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveOn: timestamp("last_active_on", {
    precision: 3,
    mode: "string",
    withTimezone: true,
  }),
  freezesAvailable: integer("freezes_available").default(0).notNull(),
  updatedAt: timestamp("updated_at", {
    precision: 3,
    mode: "string",
    withTimezone: true,
  })
    .notNull()
    .$onUpdate(() => new Date().toISOString())
    .default(sql`CURRENT_TIMESTAMP`),
});

export const userStreakRelations = relations(user_streak, ({ one }) => ({
  user: one(user, {
    fields: [user_streak.userId],
    references: [user.id],
  }),
}));

// Badges / achievements
export const badge = pgTable("badge", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 8 }),
  createdAt: timestamp("created_at", {
    precision: 3,
    mode: "string",
    withTimezone: true,
  })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const user_badge = pgTable(
  "user_badge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeId: integer("badge_id")
      .notNull()
      .references(() => badge.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniq: uniqueIndex("user_badge_user_badge_idx").on(
      table.userId,
      table.badgeId,
    ),
    userIdx: index("user_badge_user_idx").on(table.userId),
  }),
);

export const badgeRelations = relations(badge, ({ many }) => ({
  userBadges: many(user_badge),
}));

export const userBadgeRelations = relations(user_badge, ({ one }) => ({
  user: one(user, { fields: [user_badge.userId], references: [user.id] }),
  badge: one(badge, { fields: [user_badge.badgeId], references: [badge.id] }),
}));

// Social graph — follows
export const follow = pgTable(
  "follow",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    pairKey: uniqueIndex("follow_pair_idx").on(
      table.followerId,
      table.followingId,
    ),
    followerIdx: index("follow_follower_idx").on(table.followerId),
    followingIdx: index("follow_following_idx").on(table.followingId),
  }),
);

export const followRelations = relations(follow, ({ one }) => ({
  follower: one(user, {
    fields: [follow.followerId],
    references: [user.id],
    relationName: "follow_follower",
  }),
  following: one(user, {
    fields: [follow.followingId],
    references: [user.id],
    relationName: "follow_following",
  }),
}));
