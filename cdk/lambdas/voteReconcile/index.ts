import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Client } from "pg";

const ssmClient = new SSMClient({ region: "eu-west-1" });

// Helper to get values from AWS SSM
async function getSsmValue(secretName: string): Promise<string> {
  const params = {
    Name: secretName,
    WithDecryption: true,
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter not found: ${secretName}`);
    }
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

interface ReconcileStats {
  postUpvotesFixed: number;
  postDownvotesFixed: number;
  postUpvotesZeroed: number;
  postDownvotesZeroed: number;
  commentUpvotesFixed: number;
  commentDownvotesFixed: number;
  commentUpvotesZeroed: number;
  commentDownvotesZeroed: number;
  commentCountsFixed: number;
  commentCountsZeroed: number;
}

// Main Lambda handler
exports.handler = async function () {
  console.log("Vote Reconciliation Lambda running");

  const stats: ReconcileStats = {
    postUpvotesFixed: 0,
    postDownvotesFixed: 0,
    postUpvotesZeroed: 0,
    postDownvotesZeroed: 0,
    commentUpvotesFixed: 0,
    commentDownvotesFixed: 0,
    commentUpvotesZeroed: 0,
    commentDownvotesZeroed: 0,
    commentCountsFixed: 0,
    commentCountsZeroed: 0,
  };

  try {
    const DATABASE_URL = await getSsmValue("/env/db/dbUrl");

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    await client.connect();
    console.log("Connected to database");

    // 1. Fix post upvote counts where they don't match actual votes
    const postUpvotesResult = await client.query(`
      UPDATE posts p
      SET upvotes_count = v.cnt
      FROM (
        SELECT post_id, COUNT(*) as cnt
        FROM post_votes WHERE vote_type = 'up'
        GROUP BY post_id
      ) v
      WHERE p.id = v.post_id AND p.upvotes_count != v.cnt
    `);
    stats.postUpvotesFixed = postUpvotesResult.rowCount || 0;
    console.log(`Fixed ${stats.postUpvotesFixed} post upvote counts`);

    // 2. Fix post downvote counts where they don't match actual votes
    const postDownvotesResult = await client.query(`
      UPDATE posts p
      SET downvotes_count = v.cnt
      FROM (
        SELECT post_id, COUNT(*) as cnt
        FROM post_votes WHERE vote_type = 'down'
        GROUP BY post_id
      ) v
      WHERE p.id = v.post_id AND p.downvotes_count != v.cnt
    `);
    stats.postDownvotesFixed = postDownvotesResult.rowCount || 0;
    console.log(`Fixed ${stats.postDownvotesFixed} post downvote counts`);

    // 3. Zero out post upvote counts for posts with no upvotes
    const postUpvotesZeroResult = await client.query(`
      UPDATE posts
      SET upvotes_count = 0
      WHERE upvotes_count != 0
        AND id NOT IN (SELECT DISTINCT post_id FROM post_votes WHERE vote_type = 'up')
    `);
    stats.postUpvotesZeroed = postUpvotesZeroResult.rowCount || 0;
    console.log(`Zeroed ${stats.postUpvotesZeroed} post upvote counts`);

    // 4. Zero out post downvote counts for posts with no downvotes
    const postDownvotesZeroResult = await client.query(`
      UPDATE posts
      SET downvotes_count = 0
      WHERE downvotes_count != 0
        AND id NOT IN (SELECT DISTINCT post_id FROM post_votes WHERE vote_type = 'down')
    `);
    stats.postDownvotesZeroed = postDownvotesZeroResult.rowCount || 0;
    console.log(`Zeroed ${stats.postDownvotesZeroed} post downvote counts`);

    // 5. Fix comment upvote counts where they don't match actual votes
    const commentUpvotesResult = await client.query(`
      UPDATE comments c
      SET upvotes_count = v.cnt
      FROM (
        SELECT comment_id, COUNT(*) as cnt
        FROM comment_votes WHERE vote_type = 'up'
        GROUP BY comment_id
      ) v
      WHERE c.id = v.comment_id AND c.upvotes_count != v.cnt
    `);
    stats.commentUpvotesFixed = commentUpvotesResult.rowCount || 0;
    console.log(`Fixed ${stats.commentUpvotesFixed} comment upvote counts`);

    // 6. Fix comment downvote counts where they don't match actual votes
    const commentDownvotesResult = await client.query(`
      UPDATE comments c
      SET downvotes_count = v.cnt
      FROM (
        SELECT comment_id, COUNT(*) as cnt
        FROM comment_votes WHERE vote_type = 'down'
        GROUP BY comment_id
      ) v
      WHERE c.id = v.comment_id AND c.downvotes_count != v.cnt
    `);
    stats.commentDownvotesFixed = commentDownvotesResult.rowCount || 0;
    console.log(`Fixed ${stats.commentDownvotesFixed} comment downvote counts`);

    // 7. Zero out comment upvote counts for comments with no upvotes
    const commentUpvotesZeroResult = await client.query(`
      UPDATE comments
      SET upvotes_count = 0
      WHERE upvotes_count != 0
        AND id NOT IN (SELECT DISTINCT comment_id FROM comment_votes WHERE vote_type = 'up')
    `);
    stats.commentUpvotesZeroed = commentUpvotesZeroResult.rowCount || 0;
    console.log(`Zeroed ${stats.commentUpvotesZeroed} comment upvote counts`);

    // 8. Zero out comment downvote counts for comments with no downvotes
    const commentDownvotesZeroResult = await client.query(`
      UPDATE comments
      SET downvotes_count = 0
      WHERE downvotes_count != 0
        AND id NOT IN (SELECT DISTINCT comment_id FROM comment_votes WHERE vote_type = 'down')
    `);
    stats.commentDownvotesZeroed = commentDownvotesZeroResult.rowCount || 0;
    console.log(`Zeroed ${stats.commentDownvotesZeroed} comment downvote counts`);

    // 9. Fix post comment counts (excluding soft-deleted comments)
    const commentCountsResult = await client.query(`
      UPDATE posts p
      SET comments_count = COALESCE(c.cnt, 0)
      FROM (
        SELECT post_id, COUNT(*) as cnt
        FROM comments WHERE deleted_at IS NULL
        GROUP BY post_id
      ) c
      WHERE p.id = c.post_id AND p.comments_count != COALESCE(c.cnt, 0)
    `);
    stats.commentCountsFixed = commentCountsResult.rowCount || 0;
    console.log(`Fixed ${stats.commentCountsFixed} post comment counts`);

    // 10. Zero out comment counts for posts with no comments
    const commentCountsZeroResult = await client.query(`
      UPDATE posts
      SET comments_count = 0
      WHERE comments_count != 0
        AND id NOT IN (SELECT DISTINCT post_id FROM comments WHERE deleted_at IS NULL)
    `);
    stats.commentCountsZeroed = commentCountsZeroResult.rowCount || 0;
    console.log(`Zeroed ${stats.commentCountsZeroed} post comment counts`);

    await client.end();

    // Calculate total fixes
    const totalFixes =
      stats.postUpvotesFixed +
      stats.postDownvotesFixed +
      stats.postUpvotesZeroed +
      stats.postDownvotesZeroed +
      stats.commentUpvotesFixed +
      stats.commentDownvotesFixed +
      stats.commentUpvotesZeroed +
      stats.commentDownvotesZeroed +
      stats.commentCountsFixed +
      stats.commentCountsZeroed;

    console.log(`Vote Reconciliation completed. Total fixes: ${totalFixes}`);
    console.log("Stats:", JSON.stringify(stats, null, 2));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        message: totalFixes === 0 ? "All counts in sync" : `Fixed ${totalFixes} discrepancies`,
        stats,
      },
    };
  } catch (error) {
    console.error("Fatal error:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        message: "error",
        error: (error as Error).message,
        stats,
      },
    };
  }
};
