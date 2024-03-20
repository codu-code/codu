import {
  timestamp,
  index,
  integer,
  pgEnum,
  pgTable,
  bigserial,
  varchar,
  unique,
  text,
  uniqueIndex,
  serial,
  foreignKey,
  boolean,
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";

export const role = pgEnum("Role", ["MODERATOR", "ADMIN", "USER"]);

export const session = pgTable(
  "Session",
  {
    id: text("id").primaryKey().notNull(),
    sessionToken: text("sessionToken").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: timestamp("expires", { precision: 3, mode: "date" }).notNull(),
  },
  (table) => {
    return {
      sessionTokenKey: uniqueIndex("Session_sessionToken_key").on(
        table.sessionToken,
      ),
    };
  },
);

export const sessionRelations = relations(session, ({ one, many }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const account = pgTable(
  "Account",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => {
    return {
      providerProviderAccountIdKey: uniqueIndex(
        "Account_provider_providerAccountId_key",
      ).on(table.provider, table.providerAccountId),
    };
  },
);

export const accountRelations = relations(account, ({ one, many }) => ({
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
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    id: serial("id").primaryKey().notNull(),
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
}));

export const verification_token = pgTable(
  "VerificationToken",
  {
    identifier: varchar("identifier", { length: 256 }),
    token: varchar("token", { length: 256 }),
    expires: timestamp("expires"),
  },
  (t) => {
    return {
      indx0: unique().on(t.identifier, t.token),
    };
  },
);

export const post = pgTable(
  "Post",
  {
    id: text("id").primaryKey().notNull(),
    title: text("title").notNull(),
    canonicalUrl: text("canonicalUrl"),
    coverImage: text("coverImage"),
    approved: boolean("approved").default(true).notNull(),
    body: text("body").notNull(),
    excerpt: varchar("excerpt", { length: 156 }).default("").notNull(),
    readTimeMins: integer("readTimeMins").notNull(),
    published: timestamp("published", { precision: 3, mode: "date" }),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "date",
    }).notNull(),
    slug: text("slug").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    showComments: boolean("showComments").default(true).notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Post_id_key").on(table.id),
      slugKey: uniqueIndex("Post_slug_key").on(table.slug),
    };
  },
);

export const postRelations = relations(post, ({ one, many }) => ({
  bookmarks: many(bookmark),
  comments: many(comment),
  Flagged: many(flagged),
  likes: many(like),
  notifications: many(notification),
  user: one(user, { fields: [post.userId], references: [user.id] }),
  tags: many(post_tag),
}));

export const user = pgTable(
  "User",
  {
    id: text("id").primaryKey().notNull(),
    username: varchar("username", { length: 40 }),
    name: text("name").default("").notNull(),
    email: text("email"),
    emailVerified: timestamp("emailVerified", { precision: 3, mode: "date" }),
    image: text("image").default("/images/person.png").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "date",
    }).notNull(),
    bio: varchar("bio", { length: 200 }).default("").notNull(),
    location: text("location").default("").notNull(),
    websiteUrl: text("websiteUrl").default("").notNull(),
    emailNotifications: boolean("emailNotifications").default(true).notNull(),
    newsletter: boolean("newsletter").default(true).notNull(),
    firstName: text("firstName"),
    surname: text("surname"),
    gender: text("gender"),
    dateOfBirth: timestamp("dateOfBirth", { precision: 3, mode: "date" }),
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
    };
  },
);

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account),
  bans: many(banned_users),
  BannedUsers: one(banned_users),
  bookmarks: many(bookmark),
  comments: many(comment),
  flaggedNotifier: many(flagged),
  Flagged: many(flagged),
  likes: many(like),
  memberships: many(membership),
  notfier: many(notification),
  notification: many(notification),
  posts: many(post),
  RSVP: many(r_s_v_p),
  sessions: many(session),
}));

export const bookmark = pgTable(
  "Bookmark",
  {
    id: serial("id").primaryKey().notNull(),
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
    id: serial("id").primaryKey().notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "date",
    }).notNull(),
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
    };
  },
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  // parent: one(comment, {
  //   fields: [comment.parentId],
  //   references: [comment.id],
  // }),
  // children: many(comment),
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
  Flagged: many(flagged),
  likes: many(like),
  Notification: many(notification),
}));

export const like = pgTable(
  "Like",
  {
    id: serial("id").primaryKey().notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
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
    id: serial("id").primaryKey().notNull(),
    createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", {
      precision: 3,
      mode: "date",
    }).notNull(),
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

export const banned_usersRelations = relations(
  banned_users,
  ({ one, many }) => ({
    bannedBy: one(user, {
      fields: [banned_users.bannedById],
      references: [user.id],
    }),
    // user: one(user, { fields: [banned_users.userId], references: [user.id] }),
  }),
);

export const community = pgTable(
  "Community",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    coverImage: text("coverImage").notNull(),
    description: text("description").notNull(),
    excerpt: varchar("excerpt", { length: 156 }).default("").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Community_id_key").on(table.id),
      slugKey: uniqueIndex("Community_slug_key").on(table.slug),
    };
  },
);

export const communityRelations = relations(community, ({ one, many }) => ({
  events: many(event),
  members: many(membership),
}));

export const membership = pgTable("Membership", {
  id: text("id").primaryKey().notNull(),
  communityId: text("communityId")
    .notNull()
    .references(() => community.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  isEventOrganiser: boolean("isEventOrganiser").default(false).notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const membershipRelations = relations(membership, ({ one, many }) => ({
  community: one(community, {
    fields: [membership.communityId],
    references: [community.id],
  }),
  user: one(user, { fields: [membership.userId], references: [user.id] }),
}));

export const r_s_v_p = pgTable("RSVP", {
  id: text("id").primaryKey().notNull(),
  eventId: text("eventId")
    .notNull()
    .references(() => event.id, { onDelete: "cascade", onUpdate: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const r_s_v_pRelations = relations(r_s_v_p, ({ one, many }) => ({
  event: one(event, { fields: [r_s_v_p.eventId], references: [event.id] }),
  user: one(user, { fields: [r_s_v_p.userId], references: [user.id] }),
}));

export const flagged = pgTable("Flagged", {
  id: serial("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
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

export const flaggedRelations = relations(flagged, ({ one, many }) => ({
  comment: one(comment, {
    fields: [flagged.commentId],
    references: [comment.id],
  }),
  notifier: one(user, { fields: [flagged.notifierId], references: [user.id] }),
  post: one(post, { fields: [flagged.postId], references: [post.id] }),
  // user: one(user, { fields: [flagged.userId], references: [user.id] }),
}));

export const notification = pgTable("Notification", {
  id: serial("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt", { precision: 3, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" }).notNull(),
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
});

export const notificationRelations = relations(
  notification,
  ({ one, many }) => ({
    comment: one(comment, {
      fields: [notification.commentId],
      references: [comment.id],
    }),
    notifier: one(user, {
      fields: [notification.notifierId],
      references: [user.id],
    }),
    post: one(post, { fields: [notification.postId], references: [post.id] }),
    // user: one(user, { fields: [notification.userId], references: [user.id] }),
  }),
);

export const event = pgTable(
  "Event",
  {
    id: text("id").primaryKey().notNull(),
    eventDate: timestamp("eventDate", { precision: 3, mode: "date" }),
    name: text("name").notNull(),
    coverImage: text("coverImage").notNull(),
    capacity: integer("capacity").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    slug: text("slug").notNull(),
    communityId: text("communityId")
      .notNull()
      .references(() => community.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => {
    return {
      idKey: uniqueIndex("Event_id_key").on(table.id),
      slugKey: uniqueIndex("Event_slug_key").on(table.slug),
    };
  },
);

export const eventRelations = relations(event, ({ one, many }) => ({
  community: one(community, {
    fields: [event.communityId],
    references: [community.id],
  }),
  RSVP: many(r_s_v_p),
}));
