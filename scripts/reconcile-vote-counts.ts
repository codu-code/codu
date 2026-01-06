/**
 * Vote Count Reconciliation Script
 *
 * This script verifies that denormalized vote counts match actual vote records
 * and fixes any discrepancies. Database triggers should keep counts in sync,
 * but this script provides a safety net for edge cases.
 *
 * Run with: npx tsx scripts/reconcile-vote-counts.ts
 * Dry run:  npx tsx scripts/reconcile-vote-counts.ts --dry-run
 */

import { db } from "@/server/db";
import { posts, comments, post_votes, comment_votes } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";

const isDryRun = process.argv.includes("--dry-run");

interface VoteDiscrepancy {
  id: string;
  type: "post" | "comment";
  storedUpvotes: number;
  actualUpvotes: number;
  storedDownvotes: number;
  actualDownvotes: number;
}

async function reconcilePostVotes(): Promise<{
  checked: number;
  fixed: number;
  discrepancies: VoteDiscrepancy[];
}> {
  console.log("Checking post vote counts...");

  // Get actual vote counts from post_votes table
  const actualCounts = await db
    .select({
      postId: post_votes.postId,
      upvotes: sql<number>`COUNT(*) FILTER (WHERE ${post_votes.voteType} = 'up')::int`,
      downvotes: sql<number>`COUNT(*) FILTER (WHERE ${post_votes.voteType} = 'down')::int`,
    })
    .from(post_votes)
    .groupBy(post_votes.postId);

  // Create a map for quick lookup
  const actualCountsMap = new Map(
    actualCounts.map((c) => [
      c.postId,
      { upvotes: c.upvotes, downvotes: c.downvotes },
    ]),
  );

  // Get all posts with their stored counts
  const allPosts = await db
    .select({
      id: posts.id,
      upvotesCount: posts.upvotesCount,
      downvotesCount: posts.downvotesCount,
    })
    .from(posts);

  const discrepancies: VoteDiscrepancy[] = [];
  let fixed = 0;

  for (const post of allPosts) {
    const actual = actualCountsMap.get(post.id) || { upvotes: 0, downvotes: 0 };

    if (
      post.upvotesCount !== actual.upvotes ||
      post.downvotesCount !== actual.downvotes
    ) {
      discrepancies.push({
        id: post.id,
        type: "post",
        storedUpvotes: post.upvotesCount,
        actualUpvotes: actual.upvotes,
        storedDownvotes: post.downvotesCount,
        actualDownvotes: actual.downvotes,
      });

      if (!isDryRun) {
        await db
          .update(posts)
          .set({
            upvotesCount: actual.upvotes,
            downvotesCount: actual.downvotes,
          })
          .where(eq(posts.id, post.id));
        fixed++;
      }
    }
  }

  return { checked: allPosts.length, fixed, discrepancies };
}

async function reconcileCommentVotes(): Promise<{
  checked: number;
  fixed: number;
  discrepancies: VoteDiscrepancy[];
}> {
  console.log("Checking comment vote counts...");

  // Get actual vote counts from comment_votes table
  const actualCounts = await db
    .select({
      commentId: comment_votes.commentId,
      upvotes: sql<number>`COUNT(*) FILTER (WHERE ${comment_votes.voteType} = 'up')::int`,
      downvotes: sql<number>`COUNT(*) FILTER (WHERE ${comment_votes.voteType} = 'down')::int`,
    })
    .from(comment_votes)
    .groupBy(comment_votes.commentId);

  // Create a map for quick lookup
  const actualCountsMap = new Map(
    actualCounts.map((c) => [
      c.commentId,
      { upvotes: c.upvotes, downvotes: c.downvotes },
    ]),
  );

  // Get all comments with their stored counts
  const allComments = await db
    .select({
      id: comments.id,
      upvotesCount: comments.upvotesCount,
      downvotesCount: comments.downvotesCount,
    })
    .from(comments);

  const discrepancies: VoteDiscrepancy[] = [];
  let fixed = 0;

  for (const comment of allComments) {
    const actual = actualCountsMap.get(comment.id) || {
      upvotes: 0,
      downvotes: 0,
    };

    if (
      comment.upvotesCount !== actual.upvotes ||
      comment.downvotesCount !== actual.downvotes
    ) {
      discrepancies.push({
        id: comment.id,
        type: "comment",
        storedUpvotes: comment.upvotesCount,
        actualUpvotes: actual.upvotes,
        storedDownvotes: comment.downvotesCount,
        actualDownvotes: actual.downvotes,
      });

      if (!isDryRun) {
        await db
          .update(comments)
          .set({
            upvotesCount: actual.upvotes,
            downvotesCount: actual.downvotes,
          })
          .where(eq(comments.id, comment.id));
        fixed++;
      }
    }
  }

  return { checked: allComments.length, fixed, discrepancies };
}

async function reconcileCommentCounts(): Promise<{
  checked: number;
  fixed: number;
  discrepancies: Array<{
    postId: string;
    storedCount: number;
    actualCount: number;
  }>;
}> {
  console.log("Checking post comment counts...");

  // Get actual comment counts (excluding soft-deleted comments)
  const actualCounts = await db
    .select({
      postId: comments.postId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(comments)
    .where(sql`${comments.deletedAt} IS NULL`)
    .groupBy(comments.postId);

  // Create a map for quick lookup
  const actualCountsMap = new Map(actualCounts.map((c) => [c.postId, c.count]));

  // Get all posts with their stored comment counts
  const allPosts = await db
    .select({
      id: posts.id,
      commentsCount: posts.commentsCount,
    })
    .from(posts);

  const discrepancies: Array<{
    postId: string;
    storedCount: number;
    actualCount: number;
  }> = [];
  let fixed = 0;

  for (const post of allPosts) {
    const actualCount = actualCountsMap.get(post.id) || 0;

    if (post.commentsCount !== actualCount) {
      discrepancies.push({
        postId: post.id,
        storedCount: post.commentsCount,
        actualCount,
      });

      if (!isDryRun) {
        await db
          .update(posts)
          .set({ commentsCount: actualCount })
          .where(eq(posts.id, post.id));
        fixed++;
      }
    }
  }

  return { checked: allPosts.length, fixed, discrepancies };
}

async function main() {
  console.log("=== Vote Count Reconciliation ===");
  console.log(
    `Mode: ${isDryRun ? "DRY RUN (no changes will be made)" : "LIVE"}\n`,
  );

  try {
    // Reconcile post votes
    const postResult = await reconcilePostVotes();
    console.log(`\nPosts checked: ${postResult.checked}`);
    console.log(
      `Post vote discrepancies found: ${postResult.discrepancies.length}`,
    );
    if (postResult.discrepancies.length > 0) {
      console.log("Post discrepancies:");
      for (const d of postResult.discrepancies.slice(0, 10)) {
        console.log(
          `  ${d.id}: stored(${d.storedUpvotes}/${d.storedDownvotes}) vs actual(${d.actualUpvotes}/${d.actualDownvotes})`,
        );
      }
      if (postResult.discrepancies.length > 10) {
        console.log(`  ... and ${postResult.discrepancies.length - 10} more`);
      }
      if (!isDryRun) {
        console.log(`Fixed: ${postResult.fixed}`);
      }
    }

    // Reconcile comment votes
    const commentResult = await reconcileCommentVotes();
    console.log(`\nComments checked: ${commentResult.checked}`);
    console.log(
      `Comment vote discrepancies found: ${commentResult.discrepancies.length}`,
    );
    if (commentResult.discrepancies.length > 0) {
      console.log("Comment discrepancies:");
      for (const d of commentResult.discrepancies.slice(0, 10)) {
        console.log(
          `  ${d.id}: stored(${d.storedUpvotes}/${d.storedDownvotes}) vs actual(${d.actualUpvotes}/${d.actualDownvotes})`,
        );
      }
      if (commentResult.discrepancies.length > 10) {
        console.log(
          `  ... and ${commentResult.discrepancies.length - 10} more`,
        );
      }
      if (!isDryRun) {
        console.log(`Fixed: ${commentResult.fixed}`);
      }
    }

    // Reconcile comment counts
    const commentCountResult = await reconcileCommentCounts();
    console.log(
      `\nPosts checked for comment counts: ${commentCountResult.checked}`,
    );
    console.log(
      `Comment count discrepancies found: ${commentCountResult.discrepancies.length}`,
    );
    if (commentCountResult.discrepancies.length > 0) {
      console.log("Comment count discrepancies:");
      for (const d of commentCountResult.discrepancies.slice(0, 10)) {
        console.log(
          `  ${d.postId}: stored(${d.storedCount}) vs actual(${d.actualCount})`,
        );
      }
      if (commentCountResult.discrepancies.length > 10) {
        console.log(
          `  ... and ${commentCountResult.discrepancies.length - 10} more`,
        );
      }
      if (!isDryRun) {
        console.log(`Fixed: ${commentCountResult.fixed}`);
      }
    }

    // Summary
    console.log("\n=== Summary ===");
    const totalDiscrepancies =
      postResult.discrepancies.length +
      commentResult.discrepancies.length +
      commentCountResult.discrepancies.length;

    if (totalDiscrepancies === 0) {
      console.log("All vote counts are in sync!");
    } else {
      console.log(`Total discrepancies: ${totalDiscrepancies}`);
      if (isDryRun) {
        console.log("\nRun without --dry-run to fix these discrepancies.");
      } else {
        const totalFixed =
          postResult.fixed + commentResult.fixed + commentCountResult.fixed;
        console.log(`Total fixed: ${totalFixed}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Error during reconciliation:", error);
    process.exit(1);
  }
}

main();
