import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { award } from "@/server/lib/engagement";
import {
  DeletePostSchema,
  VotePostSchema,
  BookmarkPostSchema,
  GetBookmarkedPostsSchema,
  GetByIdSchema,
} from "@/schema/post";
import {
  posts,
  postVotes,
  bookmarks,
  feedSources,
  user,
  point_event,
} from "@/server/db/schema";
import { and, eq, desc, lte } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(DeletePostSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.session.user.id;
      const isAdmin = ctx.session.user.role === "ADMIN";

      const existing = await ctx.db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (!isAdmin && existing[0].authorId !== authorId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own posts",
        });
      }

      await ctx.db.delete(posts).where(eq(posts.id, input.id));

      return { success: true };
    }),

  vote: protectedProcedure
    .input(VotePostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { postId, voteType } = input;

      // Check if post exists (author needed for upvote points).
      const postItem = await ctx.db
        .select({ id: posts.id, authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const existingVote = await ctx.db
        .select({ id: postVotes.id, voteType: postVotes.voteType })
        .from(postVotes)
        .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)))
        .limit(1);

      // Whether a previous "up" vote is going away (removed or switched to
      // "down"). Used to revoke the author's upvote_received points.
      const revokingUpvote =
        existingVote.length > 0 &&
        existingVote[0].voteType === "up" &&
        voteType !== "up";

      // Database triggers handle vote count updates automatically (tr_post_vote_counts)
      if (voteType === null) {
        if (existingVote.length > 0) {
          await ctx.db
            .delete(postVotes)
            .where(eq(postVotes.id, existingVote[0].id));
        }
      } else if (existingVote.length === 0) {
        await ctx.db.insert(postVotes).values({
          postId,
          userId,
          voteType,
        });
      } else if (existingVote[0].voteType !== voteType) {
        await ctx.db
          .update(postVotes)
          .set({ voteType })
          .where(eq(postVotes.id, existingVote[0].id));
      }

      // Mirror content.vote so the author earns points consistently whichever
      // vote path the UI uses. The dedupe index makes the award idempotent per
      // (voter, post), so awarding from both routers can't double-count.
      if (revokingUpvote) {
        await ctx.db
          .delete(point_event)
          .where(
            and(
              eq(point_event.action, "upvote_received"),
              eq(point_event.sourceId, postId),
              eq(point_event.actorId, userId),
            ),
          );
      }

      if (
        voteType === "up" &&
        postItem[0].authorId &&
        postItem[0].authorId !== userId
      ) {
        await award({
          userId: postItem[0].authorId,
          action: "upvote_received",
          sourceType: "post",
          sourceId: postId,
          actorId: userId,
        });
      }

      return { voteType };
    }),

  bookmark: protectedProcedure
    .input(BookmarkPostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { postId, setBookmarked } = input;

      const postItem = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (postItem.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (setBookmarked) {
        await ctx.db
          .insert(bookmarks)
          .values({ postId, userId })
          .onConflictDoNothing();
      } else {
        await ctx.db
          .delete(bookmarks)
          .where(
            and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)),
          );
      }

      return { success: true };
    }),

  sidebarData: publicProcedure
    .input(GetByIdSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const userId = ctx.session?.user?.id;

      const [[postData], [userVoteData], [userBookmark]] = await Promise.all([
        ctx.db
          .select({
            upvotesCount: posts.upvotesCount,
            downvotesCount: posts.downvotesCount,
          })
          .from(posts)
          .where(eq(posts.id, id)),
        userId
          ? ctx.db
              .select({ voteType: postVotes.voteType })
              .from(postVotes)
              .where(
                and(eq(postVotes.postId, id), eq(postVotes.userId, userId)),
              )
          : [null],
        userId
          ? ctx.db
              .select({ id: bookmarks.id })
              .from(bookmarks)
              .where(
                and(eq(bookmarks.postId, id), eq(bookmarks.userId, userId)),
              )
          : [null],
      ]);

      return {
        upvotes: postData?.upvotesCount ?? 0,
        downvotes: postData?.downvotesCount ?? 0,
        userVote:
          (userVoteData as { voteType: "up" | "down" } | null)?.voteType ??
          null,
        currentUserBookmarked: !!userBookmark,
      };
    }),

  myBookmarks: protectedProcedure
    .input(GetBookmarkedPostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { limit, cursor } = input;

      const conditions = [eq(bookmarks.userId, userId)];

      if (cursor?.createdAt) {
        conditions.push(lte(bookmarks.createdAt, cursor.createdAt));
      }

      const results = await ctx.db
        .select({
          id: posts.id,
          type: posts.type,
          title: posts.title,
          excerpt: posts.excerpt,
          externalUrl: posts.externalUrl,
          slug: posts.slug,
          urlId: posts.urlId,
          publishedAt: posts.publishedAt,
          upvotesCount: posts.upvotesCount,
          downvotesCount: posts.downvotesCount,
          readingTime: posts.readingTime,
          sourceName: feedSources.name,
          sourceSlug: feedSources.slug,
          authorName: user.name,
          authorUsername: user.username,
          authorImage: user.image,
          bookmarkedAt: bookmarks.createdAt,
        })
        .from(bookmarks)
        .innerJoin(posts, eq(bookmarks.postId, posts.id))
        .leftJoin(feedSources, eq(posts.sourceId, feedSources.id))
        .leftJoin(user, eq(posts.authorId, user.id))
        .where(and(...conditions))
        .orderBy(desc(bookmarks.createdAt))
        .limit(limit + 1);

      let nextCursor: { id: string; createdAt?: string } | undefined;
      if (results.length > limit) {
        const lastItem = results.pop()!;
        nextCursor = {
          id: lastItem.id,
          createdAt: lastItem.bookmarkedAt || undefined,
        };
      }

      return {
        items: results,
        nextCursor,
      };
    }),
});
