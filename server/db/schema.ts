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
} from "drizzle-orm/pg-core";

import { relations, sql } from "drizzle-orm";
import { type AdapterAccount } from "next-auth/adapters";

export const role = pgEnum("Role", ["MODERATOR", "ADMIN", "USER"]);

export const session = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

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
}));

export const verificationToken = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const emailVerificationToken = pgTable("EmailVerificationToken", {
  id: serial("id").primaryKey(),
  token: text("token").unique().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  email: text("email").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

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
    };
  },
);

export const userRelations = relations(user, ({ one, many }) => ({
  accounts: many(account, { relationName: "account" }),
  bans: many(banned_users, { relationName: "bans" }),
  BannedUsers: one(banned_users, {
    fields: [user.id],
    references: [banned_users.userId],
    relationName: "BannedUsers",
  }),
  bookmarks: many(bookmark),
  comments: many(comment),
  flaggedNotifier: many(flagged),
  Flagged: many(flagged),
  likes: many(like),
  notfier: many(notification),
  notification: many(notification),
  posts: many(post),
  sessions: many(session),
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

export const banned_usersRelations = relations(
  banned_users,
  ({ one, many }) => ({
    bannedBy: one(user, {
      fields: [banned_users.bannedById],
      references: [user.id],
      relationName: "bannedBy",
    }),
    user: one(user, {
      fields: [banned_users.userId],
      references: [user.id],
      relationName: "user",
    }),
  }),
);

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

export const flaggedRelations = relations(flagged, ({ one, many }) => ({
  comment: one(comment, {
    fields: [flagged.commentId],
    references: [comment.id],
  }),
  notifier: one(user, { fields: [flagged.notifierId], references: [user.id] }),
  post: one(post, { fields: [flagged.postId], references: [post.id] }),
  user: one(user, { fields: [flagged.userId], references: [user.id] }),
}));

export const notification = pgTable("Notification", {
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
    user: one(user, { fields: [notification.userId], references: [user.id] }),
  }),
);
