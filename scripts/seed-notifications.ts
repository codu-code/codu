/**
 * Seed Test Notifications Script
 *
 * Creates test notifications for a user to verify the notifications page is working.
 *
 * Usage:
 *   npx tsx scripts/seed-notifications.ts <email_or_username>
 *
 * Examples:
 *   npx tsx scripts/seed-notifications.ts niall@codu.co
 *   npx tsx scripts/seed-notifications.ts nialljoemaher
 *
 * This script will:
 * 1. Find the user by email or username
 * 2. Find another user to act as the "notifier" (the person who triggered the notification)
 * 3. Find a published post to reference in the notification
 * 4. Create test notifications of both types (comment on post, reply to comment)
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { notification, user, posts, comments } from "../server/db/schema";
import { eq, ne, and } from "drizzle-orm";
import {
  NEW_COMMENT_ON_YOUR_POST,
  NEW_REPLY_TO_YOUR_COMMENT,
} from "../utils/notifications";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is not set");
  console.error("Make sure you have a .env file with DATABASE_URL defined");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

async function main() {
  const emailOrUsername = process.argv[2];

  if (!emailOrUsername) {
    console.error("Usage: npx tsx scripts/seed-notifications.ts <email_or_username>");
    console.error("");
    console.error("Examples:");
    console.error("  npx tsx scripts/seed-notifications.ts niall@codu.co");
    console.error("  npx tsx scripts/seed-notifications.ts nialljoemaher");
    process.exit(1);
  }

  console.log(`Finding user: ${emailOrUsername}...`);

  // Find the target user by email or username
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, email: user.email, username: user.username })
    .from(user)
    .where(
      emailOrUsername.includes("@")
        ? eq(user.email, emailOrUsername)
        : eq(user.username, emailOrUsername),
    )
    .limit(1);

  if (!targetUser) {
    console.error(`ERROR: User not found: ${emailOrUsername}`);
    console.error("Make sure the email or username is correct");
    process.exit(1);
  }

  console.log(`Found user: ${targetUser.name} (${targetUser.email})`);

  // Find another user to act as the notifier
  const [notifierUser] = await db
    .select({ id: user.id, name: user.name, username: user.username, image: user.image })
    .from(user)
    .where(ne(user.id, targetUser.id))
    .limit(1);

  if (!notifierUser) {
    console.error("ERROR: No other users found to act as notifier");
    console.error("The notifications system needs at least 2 users");
    process.exit(1);
  }

  console.log(`Using notifier: ${notifierUser.name} (@${notifierUser.username})`);

  // Find a published post (preferably owned by the target user, or any published post)
  let [targetPost] = await db
    .select({ id: posts.id, title: posts.title, slug: posts.slug })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, targetUser.id),
        eq(posts.status, "published"),
      ),
    )
    .limit(1);

  // If no post by target user, find any published post
  if (!targetPost) {
    [targetPost] = await db
      .select({ id: posts.id, title: posts.title, slug: posts.slug })
      .from(posts)
      .where(eq(posts.status, "published"))
      .limit(1);
  }

  if (!targetPost) {
    console.error("ERROR: No published posts found");
    console.error("Create at least one published post first");
    process.exit(1);
  }

  console.log(`Using post: "${targetPost.title}"`);

  // Find an existing comment on this post (optional)
  let [existingComment] = await db
    .select({ id: comments.id })
    .from(comments)
    .where(eq(comments.postId, targetPost.id))
    .limit(1);

  let commentId: number | undefined;
  if (existingComment) {
    commentId = existingComment.id;
  }

  // Create test notifications
  console.log("\nCreating test notifications...\n");

  // Type 0: New comment on your post
  const notification1 = await db
    .insert(notification)
    .values({
      userId: targetUser.id,
      notifierId: notifierUser.id,
      type: NEW_COMMENT_ON_YOUR_POST,
      postId: targetPost.id,
      commentId: commentId,
    })
    .returning();

  console.log(`Created notification: "${notifierUser.name} started a discussion on your post: ${targetPost.title}"`);

  // Type 1: Reply to your comment
  const notification2 = await db
    .insert(notification)
    .values({
      userId: targetUser.id,
      notifierId: notifierUser.id,
      type: NEW_REPLY_TO_YOUR_COMMENT,
      postId: targetPost.id,
      commentId: commentId,
    })
    .returning();

  console.log(`Created notification: "${notifierUser.name} replied to your comment on: ${targetPost.title}"`);

  // Create a few more for variety
  const notification3 = await db
    .insert(notification)
    .values({
      userId: targetUser.id,
      notifierId: notifierUser.id,
      type: NEW_COMMENT_ON_YOUR_POST,
      postId: targetPost.id,
      commentId: commentId,
    })
    .returning();

  console.log(`Created notification: "${notifierUser.name} started a discussion on your post: ${targetPost.title}"`);

  console.log("\n-------------------------------------------");
  console.log("SUCCESS! Created 3 test notifications.");
  console.log(`\nView them at: /notifications`);
  console.log("-------------------------------------------");

  process.exit(0);
}

main().catch((err) => {
  console.error("Error running seed script:", err);
  process.exit(1);
});
