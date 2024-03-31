import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { readingTime } from "../../../utils/readingTime";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import {
  PublishPostSchema,
  SavePostSchema,
  CreatePostSchema,
  DeletePostSchema,
  GetPostsSchema,
  LikePostSchema,
  BookmarkPostSchema,
  GetByIdSchema,
} from "../../../schema/post";
import { removeMarkdown } from "../../../utils/removeMarkdown";
import { bookmark, like, post, post_tag, tag, user } from "@/server/db/schema";
import {
  and,
  count,
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
          return publishTime;
        }
        return new Date();
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

      if (setLiked) {
        const [res] = await ctx.db
          .insert(like)
          .values({ postId, userId })
          .returning();

        await ctx.db
          .update(post)
          .set({
            likes: increment(post.likes),
          })
          .where(eq(post.id, postId));

        return res;
      }

      const res = await ctx.db
        .delete(like)
        .where(
          and(eq(like.postId, postId), eq(like.userId, ctx.session?.user?.id)),
        );

      await ctx.db
        .update(post)
        .set({
          likes: decrement(post.likes),
        })
        .where(eq(post.id, postId));

      return res;
    }),
  bookmark: protectedProcedure
    .input(BookmarkPostSchema)
    .mutation(async ({ input, ctx }) => {
      const { postId, setBookmarked } = input;

      if (setBookmarked) {
        const res = await ctx.db
          .insert(bookmark)
          .values({ postId, userId: ctx.session?.user?.id });
        return res;
      }

      const res = await ctx.db
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

      const [[likes], [currentUserLikedCount], [currentUserBookmarkedCount]] =
        await Promise.all([
          ctx.db
            .select({ value: count() })
            .from(like)
            .where(eq(like.postId, id)),
          // if user not logged in and they wont have any liked posts so default to a count of 0
          ctx.session?.user?.id
            ? ctx.db
                .select({ value: count() })
                .from(like)
                .where(
                  and(
                    eq(like.postId, id),
                    eq(like.userId, ctx.session.user.id),
                  ),
                )
            : [{ value: 0 }],
          // if user not logged in and they wont have any bookmarked posts so default to a count of 0
          ctx.session?.user?.id
            ? ctx.db
                .select({ value: count() })
                .from(bookmark)
                .where(
                  and(
                    eq(bookmark.postId, id),
                    eq(bookmark.userId, ctx.session.user.id),
                  ),
                )
            : [{ value: 0 }],
        ]);
      return {
        likes: likes.value,
        currentUserLiked: !!currentUserLikedCount?.value,
        currentUserBookmarked: !!currentUserBookmarkedCount?.value,
      };
    }),
  published: publicProcedure
    .input(GetPostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const limit = input?.limit ?? 50;
      const { cursor, sort, tag: tagFilter } = input;

      const paginationMapping = {
        newest: {
          orderBy: desc(post.published),
          cursor: lte(post.published, cursor?.published as Date),
        },
        oldest: {
          orderBy: asc(post.published),
          cursor: gte(post.published, cursor?.published as Date),
        },
        top: {
          orderBy: desc(post.likes),
          cursor: lt(post.likes, cursor?.likes as number),
        },
      };

      const response = await ctx.db
        .select({
          post,
          bookmarked: bookmark,
          user,
        })
        .from(post)
        .leftJoin(user, eq(post.userId, user.id))
        .leftJoin(bookmark, eq(post.id, bookmark.userId))
        .leftJoin(post_tag, eq(post.id, post_tag.postId))
        .leftJoin(tag, eq(post_tag.tagId, tag.id))
        .where(
          and(
            isNotNull(post.published),
            lte(post.published, new Date()),
            tagFilter ? eq(tag.title, tagFilter.toUpperCase()) : undefined,
            cursor ? paginationMapping[sort].cursor : undefined,
          ),
        )
        .limit(limit + 1)
        .orderBy(paginationMapping[sort].orderBy);

      const cleaned = response.map((post) => {
        let currentUserLikesPost = !!post.bookmarked;
        if (userId === undefined) currentUserLikesPost = false;
        post.bookmarked = null;
        return {
          ...post.post,
          user: post.user,
          bookmarks: post.bookmarked,
          currentUserLikesPost,
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (response.length > limit) {
        const nextItem = cleaned.pop();
        if (nextItem)
          nextCursor = {
            id: nextItem?.id,
            published: nextItem.published as Date,
            likes: nextItem.likes,
          };
      }

      return { posts: cleaned, nextCursor };
    }),
  myPublished: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.post.findMany({
      where: (posts, { lte, isNotNull, eq }) =>
        and(
          isNotNull(posts.published),
          lte(posts.published, new Date()),
          eq(posts.userId, ctx?.session?.user?.id),
        ),
      orderBy: (posts, { desc }) => [desc(posts.published)],
    });
  }),
  myScheduled: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.post.findMany({
      where: (posts, { eq }) =>
        and(
          gt(posts.published, new Date()),
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
  myBookmarks: protectedProcedure.query(async ({ ctx }) => {
    const response = await ctx.db.query.bookmark.findMany({
      where: (bookmarks, { eq }) => eq(bookmarks.userId, ctx.session.user.id),
      with: { post: { with: { user: true } } },
      orderBy: (bookmarks, { desc }) => [desc(bookmarks.id)],
    });

    return response.map(({ id, post }) => ({ bookmarkId: id, ...post }));
  }),
});
