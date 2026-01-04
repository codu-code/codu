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
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";
import { type AdapterAccount } from "next-auth/adapters";

export const role = pgEnum("Role", ["MODERATOR", "ADMIN", "USER"]);
export const voteType = pgEnum("VoteType", ["UP", "DOWN"]);

export const session = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Add this new relation definition for the session table
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

export const post_tagRelations = relations(post_tag, ({ one, many }) => ({
  post: one(post, { fields: [post_tag.postId], references: [post.id] }),
  tag: one(tag, { fields: [post_tag.tagId], references: [tag.id] }),
}));
export const tag = pgTable(
  "Tag",
  {
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    id: serial("id").primaryKey().notNull().unique(),
    title: varchar("title", { length: 20 }).notNull(),
  },
  (table) => {
    return {
      titleKey: uniqueIndex("Tag_title_key").on(table.title),
    };
  },
);

export const tagRelations = relations(tag, ({ one, many }) => ({
  PostTag: many(post_tag),
  AggregatedArticleTag: many(aggregated_article_tag),
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

// POST VOTING (Reddit-style upvote/downvote)
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
    voteType: voteType("voteType").notNull(),
    createdAt: timestamp("createdAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueVote: unique("PostVote_postId_userId_key").on(table.postId, table.userId),
    postIdIndex: index("PostVote_postId_index").on(table.postId),
  }),
);

export const postVoteRelations = relations(post_vote, ({ one }) => ({
  post: one(post, { fields: [post_vote.postId], references: [post.id] }),
  user: one(user, { fields: [post_vote.userId], references: [user.id] }),
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
  },
  (table) => {
    return {
      usernameKey: uniqueIndex("User_username_key").on(table.username),
      emailKey: uniqueIndex("User_email_key").on(table.email),
      usernameIdIdx: index("User_username_id_idx").on(table.id, table.username),
      usernameIndex: index("User_username_index").on(table.username), // Add this line
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
  bookmarks: many(bookmark),
  comments: many(comment),
  flaggedByUser: many(flagged, { relationName: "flaggedByUser" }),
  flaggedContent: many(flagged, { relationName: "flaggedContent" }),
  likes: many(like),
  postVotes: many(post_vote),
  notificationsCreated: many(notification, {
    relationName: "notificationsCreated",
  }),
  notificationsReceived: many(notification, {
    relationName: "notificationsReceived",
  }),
  posts: many(post),
  sessions: many(session),
  emailChangeRequests: many(emailChangeRequest),
  emailChangeHistory: many(emailChangeHistory),
  aggregatedArticleVotes: many(aggregated_article_vote),
  aggregatedArticleBookmarks: many(aggregated_article_bookmark),
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

export const bookmarkRelations = relations(bookmark, ({ one, many }) => ({
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
      postIdIndex: index("Comment_postId_index").on(table.postId), // Add this line
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

export const likeRelations = relations(like, ({ one, many }) => ({
  comment: one(comment, { fields: [like.commentId], references: [comment.id] }),
  post: one(post, { fields: [like.postId], references: [post.id] }),
  user: one(user, { fields: [like.userId], references: [user.id] }),
}));

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
    postId: text("postId").references(() => post.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    commentId: integer("commentId").references(() => comment.id, {
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
  comment: one(comment, {
    fields: [notification.commentId],
    references: [comment.id],
  }),
  notifier: one(user, {
    fields: [notification.notifierId],
    references: [user.id],
    relationName: "notificationsCreated",
  }),
  post: one(post, { fields: [notification.postId], references: [post.id] }),
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
    relationName: "notificationsReceived",
  }),
}));

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

// ============================================
// Content Aggregator Tables
// ============================================

export const feedSourceStatus = pgEnum("FeedSourceStatus", [
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
    status: feedSourceStatus("status").default("ACTIVE").notNull(),
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
  articles: many(aggregated_article),
}));

export const aggregated_article = pgTable(
  "AggregatedArticle",
  {
    id: serial("id").primaryKey().notNull().unique(),
    sourceId: integer("sourceId")
      .notNull()
      .references(() => feed_source.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    url: text("url").notNull(),
    imageUrl: text("imageUrl"),
    ogImageUrl: text("ogImageUrl"),
    shortId: varchar("shortId", { length: 7 }),
    author: text("author"),
    publishedAt: timestamp("publishedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),
    fetchedAt: timestamp("fetchedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),
    clickCount: integer("clickCount").default(0).notNull(),
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
      urlKey: uniqueIndex("AggregatedArticle_url_key").on(table.url),
      shortIdKey: uniqueIndex("AggregatedArticle_shortId_key").on(table.shortId),
      sourceIdIndex: index("AggregatedArticle_sourceId_index").on(
        table.sourceId,
      ),
      sourceIdShortIdIndex: index("AggregatedArticle_sourceId_shortId_index").on(
        table.sourceId,
        table.shortId,
      ),
      publishedAtIndex: index("AggregatedArticle_publishedAt_index").on(
        table.publishedAt,
      ),
      upvotesIndex: index("AggregatedArticle_upvotes_index").on(table.upvotes),
    };
  },
);

export const aggregatedArticleRelations = relations(
  aggregated_article,
  ({ one, many }) => ({
    source: one(feed_source, {
      fields: [aggregated_article.sourceId],
      references: [feed_source.id],
    }),
    tags: many(aggregated_article_tag),
    votes: many(aggregated_article_vote),
    bookmarks: many(aggregated_article_bookmark),
  }),
);

export const aggregated_article_tag = pgTable(
  "AggregatedArticleTag",
  {
    id: serial("id").primaryKey().notNull(),
    articleId: integer("articleId")
      .notNull()
      .references(() => aggregated_article.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tagId: integer("tagId")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => {
    return {
      articleIdTagIdKey: uniqueIndex(
        "AggregatedArticleTag_articleId_tagId_key",
      ).on(table.articleId, table.tagId),
    };
  },
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

export const aggregated_article_vote = pgTable(
  "AggregatedArticleVote",
  {
    id: serial("id").primaryKey().notNull().unique(),
    articleId: integer("articleId")
      .notNull()
      .references(() => aggregated_article.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    voteType: voteType("voteType").notNull(),
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
      userIdArticleIdKey: uniqueIndex(
        "AggregatedArticleVote_userId_articleId_key",
      ).on(table.userId, table.articleId),
      articleIdIndex: index("AggregatedArticleVote_articleId_index").on(
        table.articleId,
      ),
    };
  },
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
    id: serial("id").primaryKey().notNull().unique(),
    articleId: integer("articleId")
      .notNull()
      .references(() => aggregated_article.id, {
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
  (table) => {
    return {
      userIdArticleIdKey: uniqueIndex(
        "AggregatedArticleBookmark_userId_articleId_key",
      ).on(table.userId, table.articleId),
    };
  },
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

// ============================================================================
// DISCUSSION SYSTEM - Generic discussions for posts and articles
// ============================================================================

export const discussionTargetType = pgEnum("DiscussionTargetType", [
  "POST",
  "ARTICLE",
  "CONTENT",
]);

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
    // Polymorphic target - either a post OR an article OR content
    targetType: discussionTargetType("targetType").notNull(),
    postId: text("postId").references(() => post.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    articleId: integer("articleId").references(() => aggregated_article.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    contentId: text("contentId"), // Will be FK to content table - added after content table exists
    // User who wrote the discussion
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    // Self-referential for nested replies
    parentId: integer("parentId"),
    // Voting (denormalized for performance)
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
    postIdIndex: index("Discussion_postId_index").on(table.postId),
    articleIdIndex: index("Discussion_articleId_index").on(table.articleId),
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
  post: one(post, { fields: [discussion.postId], references: [post.id] }),
  article: one(aggregated_article, {
    fields: [discussion.articleId],
    references: [aggregated_article.id],
  }),
  user: one(user, { fields: [discussion.userId], references: [user.id] }),
  likes: many(discussion_like),
  votes: many(discussion_vote),
  reports: many(content_report),
}));

export const discussion_like = pgTable(
  "DiscussionLike",
  {
    id: serial("id").primaryKey().notNull().unique(),
    discussionId: integer("discussionId")
      .notNull()
      .references(() => discussion.id, {
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
    userIdDiscussionIdKey: uniqueIndex(
      "DiscussionLike_userId_discussionId_key",
    ).on(table.userId, table.discussionId),
    discussionIdIndex: index("DiscussionLike_discussionId_index").on(
      table.discussionId,
    ),
  }),
);

export const discussionLikeRelations = relations(discussion_like, ({ one }) => ({
  discussion: one(discussion, {
    fields: [discussion_like.discussionId],
    references: [discussion.id],
  }),
  user: one(user, {
    fields: [discussion_like.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// UNIFIED CONTENT SYSTEM
// ============================================================================

export const contentType = pgEnum("ContentType", [
  "ARTICLE",
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
    type: contentType("type").notNull(),

    // Common fields
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body"), // For articles/questions (Tiptap JSON or markdown)
    excerpt: text("excerpt"),

    // Author info
    userId: text("userId").references(() => user.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }), // null for RSS imports

    // External content (LINK, VIDEO, RSS articles)
    externalUrl: varchar("externalUrl", { length: 2000 }),
    imageUrl: text("imageUrl"),
    ogImageUrl: text("ogImageUrl"),

    // Source info (for RSS content)
    sourceId: integer("sourceId").references(() => feed_source.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    sourceAuthor: varchar("sourceAuthor", { length: 200 }),

    // Publishing
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("publishedAt", {
      precision: 3,
      mode: "string",
      withTimezone: true,
    }),

    // Voting (denormalized for performance)
    upvotes: integer("upvotes").default(0).notNull(),
    downvotes: integer("downvotes").default(0).notNull(),

    // Metadata
    readTimeMins: integer("readTimeMins"),
    clickCount: integer("clickCount").default(0).notNull(),

    // SEO & URL
    slug: varchar("slug", { length: 300 }),
    canonicalUrl: text("canonicalUrl"),
    coverImage: text("coverImage"),

    // Settings
    showComments: boolean("showComments").default(true).notNull(),

    // Timestamps
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
}));

export const content_vote = pgTable(
  "ContentVote",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    voteType: voteType("voteType").notNull(),
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
      .references(() => content.id, { onDelete: "cascade", onUpdate: "cascade" }),
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

export const contentBookmarkRelations = relations(content_bookmark, ({ one }) => ({
  content: one(content, {
    fields: [content_bookmark.contentId],
    references: [content.id],
  }),
  user: one(user, { fields: [content_bookmark.userId], references: [user.id] }),
}));

export const content_tag = pgTable(
  "ContentTag",
  {
    id: serial("id").primaryKey().notNull(),
    contentId: text("contentId")
      .notNull()
      .references(() => content.id, { onDelete: "cascade", onUpdate: "cascade" }),
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

// ============================================================================
// DISCUSSION VOTING (Reddit-style upvote/downvote)
// ============================================================================

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
    voteType: voteType("voteType").notNull(),
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

export const discussionVoteRelations = relations(discussion_vote, ({ one }) => ({
  discussion: one(discussion, {
    fields: [discussion_vote.discussionId],
    references: [discussion.id],
  }),
  user: one(user, { fields: [discussion_vote.userId], references: [user.id] }),
}));

// ============================================================================
// CONTENT REPORTING SYSTEM
// ============================================================================

export const reportReason = pgEnum("ReportReason", [
  "SPAM",
  "HARASSMENT",
  "HATE_SPEECH",
  "MISINFORMATION",
  "COPYRIGHT",
  "NSFW",
  "OFF_TOPIC",
  "OTHER",
]);

export const reportStatus = pgEnum("ReportStatus", [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
  "ACTIONED",
]);

export const content_report = pgTable(
  "ContentReport",
  {
    id: serial("id").primaryKey().notNull(),
    // Can report content OR discussion (one must be set)
    contentId: text("contentId").references(() => content.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    discussionId: integer("discussionId").references(() => discussion.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    // Legacy support for old Post/Article tables during migration
    legacyPostId: text("legacyPostId"),
    legacyArticleId: integer("legacyArticleId"),
    // Reporter info
    reporterId: text("reporterId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: reportReason("reason").notNull(),
    details: text("details"), // Optional additional info
    // Review info
    status: reportStatus("status").default("PENDING").notNull(),
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
    // Timestamps
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
    reporterIdIndex: index("ContentReport_reporterId_index").on(table.reporterId),
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
