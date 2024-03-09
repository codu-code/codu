import {
  timestamp,
  index,
  integer,
  pgEnum,
  pgTable,
  bigserial,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";

export const role = pgEnum("Role", ["USER", "ADMIN", "MODERATOR"]);

export const session = pgTable(
  "Session",
  {
    id: varchar("id", { length: 256 }),
    sessionToken: varchar("sessionToken", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    expires: timestamp("expires"),
  },
  (t) => {
    return {};
  },
);

export const sessionRelations = relations(session, ({ one, many }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const account = pgTable(
  "Account",
  {
    id: varchar("id", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    type: varchar("type", { length: 256 }),
    provider: varchar("provider", { length: 256 }),
    providerAccountId: varchar("providerAccountId", { length: 256 }),
    refresh_token: varchar("refresh_token", { length: 256 }),
    access_token: varchar("access_token", { length: 256 }),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 256 }),
    scope: varchar("scope", { length: 256 }),
    id_token: varchar("id_token", { length: 256 }),
    session_state: varchar("session_state", { length: 256 }),
  },
  (t) => {
    return {
      indx0: unique().on(t.provider, t.providerAccountId),
    };
  },
);

export const accountRelations = relations(account, ({ one, many }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const post_tag = pgTable(
  "PostTag",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tagId: integer("tagId").notNull(),
    postId: varchar("postId", { length: 256 }),
  },
  (t) => {
    return {
      indx0: unique().on(t.tagId, t.postId),
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    id: bigserial("id", { mode: "number" }).primaryKey(),
    title: varchar("title", { length: 256 }),
  },
  (t) => {
    return {};
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
    id: varchar("id", { length: 256 }),
    title: varchar("title", { length: 256 }),
    canonicalUrl: varchar("canonicalUrl", { length: 256 }),
    coverImage: varchar("coverImage", { length: 256 }),
    approved: integer("approved").default(1),
    body: varchar("body", { length: 256 }),
    excerpt: varchar("excerpt", { length: 256 }),
    readTimeMins: integer("readTimeMins").notNull(),
    published: timestamp("published"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    slug: varchar("slug", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    showComments: integer("showComments").default(1),
  },
  (t) => {
    return {};
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
    id: varchar("id", { length: 256 }),
    username: varchar("username", { length: 256 }),
    name: varchar("name", { length: 256 }).default(""),
    email: varchar("email", { length: 256 }),
    emailVerified: timestamp("emailVerified"),
    image: varchar("image", { length: 256 }).default("/images/person.png"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    bio: varchar("bio", { length: 256 }),
    location: varchar("location", { length: 256 }).default(""),
    websiteUrl: varchar("websiteUrl", { length: 256 }).default(""),
    emailNotifications: integer("emailNotifications").default(1),
    newsletter: integer("newsletter").default(1),
    professionalOrStudent: varchar("professionalOrStudent", { length: 256 }),
    role: role("USER"),
  },
  (t) => {
    return {
      indx0: index("username_t.id").on(t.username, t.id),
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
    id: bigserial("id", { mode: "number" }).primaryKey(),
    postId: varchar("postId", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
  },
  (t) => {
    return {
      indx0: unique().on(t.userId, t.postId),
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
    id: bigserial("id", { mode: "number" }).primaryKey(),
    body: varchar("body", { length: 256 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    postId: varchar("postId", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    parentId: integer("parentId"),
  },
  (t) => {
    return {};
  },
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
  }),
  children: many(comment),
  post: one(post, { fields: [comment.postId], references: [post.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
  Flagged: many(flagged),
  likes: many(like),
  Notification: many(notification),
}));

export const like = pgTable(
  "Like",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    userId: varchar("userId", { length: 256 }),
    postId: varchar("postId", { length: 256 }),
    commentId: integer("commentId"),
  },
  (t) => {
    return {
      indx0: unique().on(t.userId, t.commentId),
      indx1: unique().on(t.userId, t.postId),
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
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    userId: varchar("userId", { length: 256 }),
    bannedById: varchar("bannedById", { length: 256 }),
    note: varchar("note", { length: 256 }),
  },
  (t) => {
    return {};
  },
);

export const banned_usersRelations = relations(
  banned_users,
  ({ one, many }) => ({
    bannedBy: one(user, {
      fields: [banned_users.bannedById],
      references: [user.id],
    }),
    user: one(user, { fields: [banned_users.userId], references: [user.id] }),
  }),
);

export const community = pgTable(
  "Community",
  {
    id: varchar("id", { length: 256 }),
    name: varchar("name", { length: 256 }),
    city: varchar("city", { length: 256 }),
    country: varchar("country", { length: 256 }),
    coverImage: varchar("coverImage", { length: 256 }),
    description: varchar("description", { length: 256 }),
    excerpt: varchar("excerpt", { length: 256 }),
    slug: varchar("slug", { length: 256 }),
  },
  (t) => {
    return {};
  },
);

export const communityRelations = relations(community, ({ one, many }) => ({
  events: many(event),
  members: many(membership),
}));

export const membership = pgTable(
  "Membership",
  {
    id: varchar("id", { length: 256 }),
    communityId: varchar("communityId", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    isEventOrganiser: integer("isEventOrganiser").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => {
    return {};
  },
);

export const membershipRelations = relations(membership, ({ one, many }) => ({
  community: one(community, {
    fields: [membership.communityId],
    references: [community.id],
  }),
  user: one(user, { fields: [membership.userId], references: [user.id] }),
}));

export const r_s_v_p = pgTable(
  "RSVP",
  {
    id: varchar("id", { length: 256 }),
    eventId: varchar("eventId", { length: 256 }),
    userId: varchar("userId", { length: 256 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => {
    return {};
  },
);

export const r_s_v_pRelations = relations(r_s_v_p, ({ one, many }) => ({
  event: one(event, { fields: [r_s_v_p.eventId], references: [event.id] }),
  user: one(user, { fields: [r_s_v_p.userId], references: [user.id] }),
}));

export const flagged = pgTable(
  "Flagged",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    userId: varchar("userId", { length: 256 }),
    notifierId: varchar("notifierId", { length: 256 }),
    note: varchar("note", { length: 256 }),
    postId: varchar("postId", { length: 256 }),
    commentId: integer("commentId"),
  },
  (t) => {
    return {};
  },
);

export const flaggedRelations = relations(flagged, ({ one, many }) => ({
  comment: one(comment, {
    fields: [flagged.commentId],
    references: [comment.id],
  }),
  notifier: one(user, { fields: [flagged.notifierId], references: [user.id] }),
  post: one(post, { fields: [flagged.postId], references: [post.id] }),
  user: one(user, { fields: [flagged.userId], references: [user.id] }),
}));

export const notification = pgTable(
  "Notification",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    type: integer("type").notNull(),
    userId: varchar("userId", { length: 256 }),
    postId: varchar("postId", { length: 256 }),
    commentId: integer("commentId"),
    notifierId: varchar("notifierId", { length: 256 }),
  },
  (t) => {
    return {};
  },
);

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
    user: one(user, { fields: [notification.userId], references: [user.id] }),
  }),
);

export const event = pgTable(
  "Event",
  {
    id: varchar("id", { length: 256 }),
    eventDate: timestamp("eventDate"),
    name: varchar("name", { length: 256 }),
    coverImage: varchar("coverImage", { length: 256 }),
    capacity: integer("capacity").notNull(),
    description: varchar("description", { length: 256 }),
    address: varchar("address", { length: 256 }),
    slug: varchar("slug", { length: 256 }),
    communityId: varchar("communityId", { length: 256 }),
  },
  (t) => {
    return {};
  },
);

export const eventRelations = relations(event, ({ one, many }) => ({
  community: one(community, {
    fields: [event.communityId],
    references: [community.id],
  }),
  RSVP: many(r_s_v_p),
}));
