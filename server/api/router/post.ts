import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { readingTime } from "@/utils/readingTime";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  PublishPostSchema,
  SavePostSchema,
  CreatePostSchema,
  DeletePostSchema,
  GetPostsSchema,
  LikePostSchema,
  VotePostSchema,
  BookmarkPostSchema,
  GetByIdSchema,
  GetLimitSidePosts,
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";
import { bookmark, like, post, post_tag, post_vote, tag, user } from "@/server/db/schema";
import {
  and,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  desc,
  lt,
  asc,
  gte,
  sql,
} from "drizzle-orm";
import { decrement, increment } from "./utils";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { body } = input;
      const id = nanoid(8);
      const [newPost] = await ctx.db
        .insert(post)
        .values({
          ...input,
          id,
          readTimeMins: readingTime(body),
          slug: id,
          userId: ctx.session.user.id,
        })
        .returning();

      return newPost;
    }),
  update: protectedProcedure
    .input(SavePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, body, title, excerpt, canonicalUrl, tags = [] } = input;

      const currentPost = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      // if user doesnt link any tags to the article no point in doing the tag operations
      // This also makes autosave during writing faster
      if (tags.length > 0) {
        const existingTags = await ctx.db
          .select()
          .from(tag)
          .where(inArray(tag.title, tags));

        const tagResponse = (
          await Promise.all(
            tags.map((tagTitle) =>
              ctx.db
                .insert(tag)
                .values({ title: tagTitle })
                .onConflictDoNothing({
                  target: [tag.title],
                })
                .returning(),
            ),
          )
        ).flat(2);

        const tagsToLinkToPost = [...tagResponse, ...existingTags];

        await ctx.db.delete(post_tag).where(eq(post_tag.postId, id));

        await Promise.all(
          tagsToLinkToPost.map((tag) =>
            ctx.db.insert(post_tag).values({
              tagId: tag.id,
              postId: id,
            }),
          ),
        );
      }

      const getExcerptValue = (): string | undefined => {
        if (currentPost.published) {
          return excerpt && excerpt.length > 0
            ? excerpt
            : // @Todo why is body string | null ?
              removeMarkdown(currentPost.body as string, {}).substring(0, 156);
        }
        return excerpt;
      };

      const postResponse = await ctx.db
        .update(post)
        .set({
          id,
          body,
          title,
          excerpt: getExcerptValue() || "",
          readTimeMins: readingTime(body),
          canonicalUrl: !!canonicalUrl ? canonicalUrl : null,
        })
        .where(eq(post.id, id));

      return postResponse;
    }),
  publish: protectedProcedure
    .input(PublishPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { published, id, publishTime } = input;

      const getPublishedTime = () => {
        if (!published) {
          return null;
        }
        if (publishTime) {
          return new Date(publishTime).toISOString();
        }
        return new Date().toISOString();
      };

      const currentPost = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const { excerpt, title } = currentPost;

      const excerptOrCreatedExcerpt: string =
        excerpt.length > 0
          ? excerpt
          : removeMarkdown(currentPost.body, {}).substring(0, 156);

      const [updatedPost] = await ctx.db
        .update(post)
        .set({
          slug: `${title.replace(/\W+/g, "-")}-${id}`
            .toLowerCase()
            .replace(/^-+|-+(?=-|$)/g, ""),
          published: getPublishedTime(),
          excerpt: excerptOrCreatedExcerpt,
        })
        .where(eq(post.id, id))
        .returning();

      return updatedPost;
    }),
  delete: protectedProcedure
    .input(DeletePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      const currentPost = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
      });

      const isAdmin = ctx.session.user.role === "ADMIN";

      if (!isAdmin && currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const [deletedPost] = await ctx.db
        .delete(post)
        .where(eq(post.id, id))
        .returning();

      return deletedPost;
    }),
  like: protectedProcedure
    .input(LikePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { postId, setLiked } = input;
      const userId = ctx.session.user.id;
      let res;

      setLiked
        ? await ctx.db.transaction(async (tx) => {
            res = await tx.insert(like).values({ postId, userId }).returning();
            await tx
              .update(post)
              .set({
                likes: increment(post.likes),
              })
              .where(eq(post.id, postId));
          })
        : await ctx.db.transaction(async (tx) => {
            res = await tx
              .delete(like)
              .where(
                and(
                  eq(like.postId, postId),
                  eq(like.userId, ctx.session?.user?.id),
                ),
              )
              .returning();
            if (res.length !== 0) {
              await tx
                .update(post)
                .set({
                  likes: decrement(post.likes),
                })
                .where(eq(post.id, postId));
            }
          });

      return res;
    }),
  vote: protectedProcedure
    .input(VotePostSchema)
    .mutation(async ({ input, ctx }) => {
      const { postId, voteType } = input;
      const userId = ctx.session.user.id;

      return await ctx.db.transaction(async (tx) => {
        // Get existing vote
        const [existingVote] = await tx
          .select()
          .from(post_vote)
          .where(
            and(eq(post_vote.postId, postId), eq(post_vote.userId, userId)),
          );

        // If removing vote (voteType is null)
        if (voteType === null) {
          if (existingVote) {
            await tx
              .delete(post_vote)
              .where(
                and(eq(post_vote.postId, postId), eq(post_vote.userId, userId)),
              );

            // Update counts
            if (existingVote.voteType === "UP") {
              await tx
                .update(post)
                .set({ upvotes: decrement(post.upvotes) })
                .where(eq(post.id, postId));
            } else {
              await tx
                .update(post)
                .set({ downvotes: decrement(post.downvotes) })
                .where(eq(post.id, postId));
            }
          }
          return { voteType: null };
        }

        // If changing vote
        if (existingVote) {
          if (existingVote.voteType !== voteType) {
            // Update vote type
            await tx
              .update(post_vote)
              .set({ voteType })
              .where(
                and(eq(post_vote.postId, postId), eq(post_vote.userId, userId)),
              );

            // Update counts (swap)
            if (voteType === "UP") {
              await tx
                .update(post)
                .set({
                  upvotes: increment(post.upvotes),
                  downvotes: decrement(post.downvotes),
                })
                .where(eq(post.id, postId));
            } else {
              await tx
                .update(post)
                .set({
                  upvotes: decrement(post.upvotes),
                  downvotes: increment(post.downvotes),
                })
                .where(eq(post.id, postId));
            }
          }
        } else {
          // New vote
          await tx.insert(post_vote).values({ postId, userId, voteType });

          // Update counts
          if (voteType === "UP") {
            await tx
              .update(post)
              .set({ upvotes: increment(post.upvotes) })
              .where(eq(post.id, postId));
          } else {
            await tx
              .update(post)
              .set({ downvotes: increment(post.downvotes) })
              .where(eq(post.id, postId));
          }
        }

        return { voteType };
      });
    }),
  bookmark: protectedProcedure
    .input(BookmarkPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { postId, setBookmarked } = input;
      let res;

      setBookmarked
        ? await ctx.db
            .insert(bookmark)
            .values({ postId, userId: ctx.session?.user?.id })
        : await ctx.db
            .delete(bookmark)
            .where(
              and(
                eq(bookmark.postId, postId),
                eq(bookmark.userId, ctx.session?.user?.id),
              ),
            );
      return res;
    }),
  sidebarData: publicProcedure
    .input(GetByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const [[postData], [userVoteData], [userBookedmarkedPost]] =
        await Promise.all([
          ctx.db
            .select({
              upvotes: post.upvotes,
              downvotes: post.downvotes,
              likes: post.likes,
            })
            .from(post)
            .where(eq(post.id, id)),
          // Get user's vote on this post
          ctx.session?.user?.id
            ? ctx.db
                .select({ voteType: post_vote.voteType })
                .from(post_vote)
                .where(
                  and(
                    eq(post_vote.postId, id),
                    eq(post_vote.userId, ctx.session.user.id),
                  ),
                )
            : [null],
          // if user not logged in and they wont have any bookmarked posts so default to a count of 0
          ctx.session?.user?.id
            ? ctx.db
                .selectDistinct()
                .from(bookmark)
                .where(
                  and(
                    eq(bookmark.postId, id),
                    eq(bookmark.userId, ctx.session.user.id),
                  ),
                )
            : [false],
        ]);
      return {
        upvotes: postData?.upvotes ?? 0,
        downvotes: postData?.downvotes ?? 0,
        likes: postData?.likes ?? 0,
        userVote: (userVoteData as { voteType: "UP" | "DOWN" } | null)?.voteType ?? null,
        currentUserLiked: false, // Deprecated, kept for backwards compatibility
        currentUserBookmarked: !!userBookedmarkedPost,
      };
    }),
  published: publicProcedure
    .input(GetPostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 50;
      const { cursor, sort, tag: tagFilter } = input;

      // Reddit-style hot score calculation
      // Formula: log10(max(|score|, 1)) + sign(score) * seconds / 45000
      // This makes recent content with votes rank higher than old content with many votes
      const hotScoreExpr = sql<number>`
        LOG(GREATEST(ABS(${post.upvotes} - ${post.downvotes}), 1)) +
        SIGN(${post.upvotes} - ${post.downvotes}) *
        EXTRACT(EPOCH FROM (${post.published}::timestamp - '2024-01-01'::timestamp)) / 45000
      `;

      const paginationMapping = {
        newest: {
          orderBy: desc(post.published),
          cursor: lte(post.published, cursor?.published as string),
        },
        oldest: {
          orderBy: asc(post.published),
          cursor: gte(post.published, cursor?.published as string),
        },
        top: {
          orderBy: desc(sql`${post.upvotes} - ${post.downvotes}`),
          cursor: lt(sql`${post.upvotes} - ${post.downvotes}`, cursor?.likes as number),
        },
        trending: {
          orderBy: desc(hotScoreExpr),
          cursor: cursor?.hotScore
            ? lt(hotScoreExpr, cursor.hotScore)
            : undefined,
        },
      };

      const bookmarked = ctx.db
        .select()
        .from(bookmark)
        // if user not logged in just default to searching for "" as user which will always result in post not being bookmarked
        // TODO figure out a way to skip this entire block if user is not logged in
        .where(eq(bookmark.userId, userId || ""))
        .as("bookmarked");

      const userVoteSubquery = ctx.db
        .select()
        .from(post_vote)
        .where(eq(post_vote.userId, userId || ""))
        .as("userVote");

      const response = await ctx.db
        .select({
          post: {
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            published: post.published,
            readTimeMins: post.readTimeMins,
            likes: post.likes,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
          },
          bookmarked: { id: bookmarked.id },
          userVote: { voteType: userVoteSubquery.voteType },
          user: { name: user.name, username: user.username, image: user.image },
        })
        .from(post)
        .leftJoin(user, eq(post.userId, user.id))
        .leftJoin(bookmarked, eq(bookmarked.postId, post.id))
        .leftJoin(userVoteSubquery, eq(userVoteSubquery.postId, post.id))
        .leftJoin(post_tag, eq(post.id, post_tag.postId))
        .leftJoin(tag, eq(post_tag.tagId, tag.id))
        .where(
          and(
            isNotNull(post.published),
            lte(post.published, new Date().toISOString()),
            tagFilter ? eq(tag.title, tagFilter.toUpperCase()) : undefined,
            cursor ? paginationMapping[sort].cursor : undefined,
          ),
        )
        .groupBy(
          post.id,
          post.slug,
          post.title,
          post.excerpt,
          post.published,
          post.readTimeMins,
          post.likes,
          post.upvotes,
          post.downvotes,
          bookmarked.id,
          userVoteSubquery.voteType,
          user.id,
        )
        .limit(limit + 1)
        .orderBy(paginationMapping[sort].orderBy);

      // Calculate hotScore for each post (for pagination)
      const calculateHotScore = (
        upvotes: number,
        downvotes: number,
        publishedAt: string,
      ): number => {
        const score = upvotes - downvotes;
        const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
        const epoch2024 = new Date("2024-01-01").getTime() / 1000;
        const publishedEpoch = new Date(publishedAt).getTime() / 1000;
        const seconds = publishedEpoch - epoch2024;
        return Math.log10(Math.max(Math.abs(score), 1)) + (sign * seconds) / 45000;
      };

      const cleaned = response.map((elem) => {
        const currentUserBookmarkedPost = userId ? !!elem.bookmarked : false;
        const hotScore = calculateHotScore(
          elem.post.upvotes,
          elem.post.downvotes,
          elem.post.published as string,
        );
        return {
          ...elem.post,
          user: elem.user,
          currentUserBookmarkedPost,
          userVote: elem.userVote?.voteType ?? null,
          hotScore,
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (response.length > limit) {
        const nextItem = cleaned.pop();
        if (nextItem)
          nextCursor = {
            id: nextItem?.id,
            published: nextItem.published as string,
            likes: nextItem.likes,
            hotScore: sort === "trending" ? nextItem.hotScore : undefined,
          };
      }

      return { posts: cleaned, nextCursor };
    }),
  myPublished: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.post.findMany({
      where: (posts, { lte, isNotNull, eq }) =>
        and(
          isNotNull(posts.published),
          lte(posts.published, new Date().toISOString()),
          eq(posts.userId, ctx?.session?.user?.id),
        ),
      orderBy: (posts, { desc, sql }) => [
        desc(sql`GREATEST(${posts.updatedAt}, ${posts.published})`),
      ],
    });
  }),
  myScheduled: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.post.findMany({
      where: (posts, { eq }) =>
        and(
          gt(posts.published, new Date().toISOString()),
          isNotNull(posts.published),
          eq(posts.userId, ctx?.session?.user?.id),
        ),
      orderBy: (posts, { asc }) => [asc(posts.published)],
    });
  }),
  myDrafts: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.post.findMany({
      where: (posts, { eq }) =>
        and(eq(posts.userId, ctx.session.user.id), isNull(posts.published)),
      orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
    });
  }),
  editDraft: protectedProcedure
    .input(GetByIdSchema)
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const currentPost = await ctx.db.query.post.findFirst({
        where: (posts, { eq }) => eq(posts.id, id),
        with: {
          tags: { with: { tag: true } },
        },
      });

      if (currentPost?.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      return currentPost;
    }),
  myBookmarks: protectedProcedure
    .input(GetLimitSidePosts)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? undefined;

      const response = await ctx.db.query.bookmark.findMany({
        columns: {
          id: true,
        },
        where: (bookmarks, { eq }) => eq(bookmarks.userId, ctx.session.user.id),
        with: {
          post: {
            columns: {
              id: true,
              title: true,
              excerpt: true,
              updatedAt: true,
              published: true,
              readTimeMins: true,
              slug: true,
            },
            with: {
              user: {
                columns: {
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: (bookmarks, { desc }) => [desc(bookmarks.id)],
      });

      const totalCount = response.length;

      const bookmarksResponse = response.slice(0, limit || response.length);

      return {
        totalCount,
        bookmarks: bookmarksResponse.map(({ id, post }) => ({
          bookmarkId: id,
          ...post,
        })),
      };
    }),
});
