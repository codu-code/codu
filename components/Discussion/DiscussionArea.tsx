"use client";

import React, { useState } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { signIn, useSession } from "next-auth/react";
import { Fragment } from "react";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import Markdoc from "@markdoc/markdoc";
import { toast } from "sonner";
import { ZodError } from "zod";
import { ChatBubbleLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { EditDiscussionSchema } from "@/schema/discussion";
import { api } from "@/server/trpc/react";
import { useReportModal } from "@/components/ReportModal/ReportModal";
import VoteControl from "@/components/Vote/VoteControl";
import { FilterPill, type Option } from "@/components/Feed/Filters";
import { DiscussionEditor } from "./DiscussionEditor";

interface Props {
  contentId: string;
  noWrapper?: boolean;
}

type SortOrder = "top" | "new" | "oldest";

const sortOptions: Option[] = [
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
  { value: "oldest", label: "Oldest" },
];

const DiscussionArea = ({ contentId, noWrapper = false }: Props) => {
  const [showCommentBoxId, setShowCommentBoxId] = useState<string | null>(null);
  const [editCommentBoxId, setEditCommentBoxId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("top");

  const { data: session } = useSession();
  const { openReport } = useReportModal();
  const utils = api.useUtils();

  const { data: isFollowing } = api.discussion.isFollowing.useQuery(
    { postId: contentId },
    { enabled: !!session, retry: false },
  );

  const onFollowSettled = () =>
    utils.discussion.isFollowing.invalidate({ postId: contentId });
  const followMut = api.discussion.follow.useMutation({
    onSettled: onFollowSettled,
  });
  const unfollowMut = api.discussion.unfollow.useMutation({
    onSettled: onFollowSettled,
  });
  const followPending = followMut.isPending || unfollowMut.isPending;

  const toggleFollow = () => {
    if (!session) return signIn();
    if (followPending) return;
    if (isFollowing) unfollowMut.mutate({ postId: contentId });
    else followMut.mutate({ postId: contentId });
  };

  const {
    data: discussionsResponse,
    refetch,
    status: discussionStatus,
  } = api.discussion.get.useQuery({
    contentId,
  });

  const { mutate, status: createDiscussionStatus } =
    api.discussion.create.useMutation({
      onSuccess: () => {
        refetch();
        setShowCommentBoxId(null);
      },
    });

  const { mutate: vote, status: voteStatus } = api.discussion.vote.useMutation({
    onSettled() {
      refetch();
    },
    onError() {
      toast.error("Something went wrong, try again.");
    },
  });

  const voteDiscussion = (
    discussionId: string,
    voteType: "up" | "down" | null,
  ) => {
    if (!session) return signIn();
    if (voteStatus === "pending") return;
    vote({ discussionId, voteType });
  };

  const discussions = discussionsResponse?.data;

  const { mutate: editDiscussion, status: editStatus } =
    api.discussion.edit.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const { mutate: deleteDiscussion } = api.discussion.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const firstChild = discussions?.[0]?.children;

  type Discussions = typeof discussions;
  type Children = typeof firstChild;

  const sortDiscussions = (
    items: Discussions | Children | undefined,
  ): typeof items => {
    if (!items) return items;
    const sorted = [...items].sort((a, b) => {
      if (sortOrder === "top") {
        return b.score - a.score;
      }
      if (sortOrder === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted as typeof items;
  };

  const initiallyLoaded = discussionStatus === "success" || !!discussions;

  const handleCreateComment = async (body: string, parentId?: string) => {
    const ast = Markdoc.parse(body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical",
    );

    if (errors.length > 0) {
      errors.forEach((err) => {
        toast.error(err.error.message);
      });
      throw new Error("Invalid markdown");
    }

    try {
      await mutate({
        body,
        contentId,
        parentId,
      });
    } catch (err) {
      toast.error("Something went wrong saving your comment.");
      throw err;
    }
  };

  const handleEditComment = async (body: string, id: string) => {
    const ast = Markdoc.parse(body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical",
    );

    if (errors.length > 0) {
      errors.forEach((err) => {
        toast.error(err.error.message);
      });
      throw new Error("Invalid markdown");
    }

    try {
      EditDiscussionSchema.parse({ body, id });
      await editDiscussion({ body, id });
      setEditCommentBoxId(null);
      setEditContent("");
    } catch (err) {
      if (err instanceof ZodError) {
        toast.error(err.issues[0].message);
        throw err;
      }
      toast.error("Something went wrong editing your comment.");
      throw err;
    }
  };

  const generateDiscussions = (
    discussionsArr: Discussions | Children | undefined,
    depth = 0,
  ) => {
    if (!discussionsArr) return null;
    const sortedDiscussions = sortDiscussions(discussionsArr);
    if (!sortedDiscussions) return null;

    return sortedDiscussions.map(
      ({
        body,
        createdAt,
        updatedAt,
        id,
        userVote,
        score,
        user: { name, image, username, id: odiserId },
        children,
      }: {
        body: string;
        createdAt: string;
        updatedAt: string;
        id: string;
        youLikedThis: boolean;
        likeCount: number;
        userVote: "up" | "down" | null;
        score: number;
        upvotes: number;
        downvotes: number;
        user: { name: string; image: string; username: string; id: string };
        children?: Children;
      }) => {
        const ast = Markdoc.parse(body);
        const content = Markdoc.transform(ast, config);
        const isCurrentUser = session?.user?.id === odiserId;
        const dateTime = Temporal.Instant.from(
          new Date(createdAt).toISOString(),
        );
        const isCurrentYear =
          new Date().getFullYear() === new Date(createdAt).getFullYear();
        const readableDate = dateTime.toLocaleString(
          ["en-IE"],
          isCurrentYear
            ? {
                month: "long",
                day: "numeric",
              }
            : {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
        );

        const discussionUpdated =
          new Date(createdAt).toISOString() !==
          new Date(updatedAt).toISOString();

        const hasReplies = children && children.length > 0;

        return (
          <section
            key={id}
            id={`comment-${id}`}
            className="group/comment scroll-mt-24"
          >
            {editCommentBoxId !== id ? (
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Link href={`/${username}`}>
                    <img
                      className="h-9 w-9 rounded-full bg-elevated object-cover"
                      alt={`Avatar for ${name}`}
                      src={image}
                    />
                  </Link>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Link
                        className="text-sm font-semibold text-fg hover:underline"
                        href={`/${username}`}
                      >
                        {name}
                      </Link>
                      {isCurrentUser && (
                        <span className="rounded-sm bg-accent/10 px-1.5 py-[1px] font-mono text-[10px] font-semibold uppercase tracking-wider text-accent-soft">
                          You
                        </span>
                      )}
                      <span className="font-mono text-xs text-faint">
                        @{username} · {readableDate}
                        {discussionUpdated ? " · edited" : ""}
                      </span>
                    </div>
                    <Menu as="div" className="relative">
                      <MenuButton className="rounded-full p-1 text-faint transition-colors hover:bg-elevated hover:text-fg">
                        <span className="sr-only">Comment options</span>
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 top-8 z-10 w-44 origin-top-right rounded-lg border border-strong bg-elevated p-2 shadow-pop focus:outline-none">
                          {isCurrentUser ? (
                            <>
                              <MenuItem>
                                <button
                                  className="block w-full rounded-md px-2 py-2 text-left text-sm text-fg transition-colors hover:bg-surface data-[focus]:bg-surface"
                                  onClick={() => {
                                    setEditContent(body);
                                    setEditCommentBoxId(id);
                                    setShowCommentBoxId(null);
                                  }}
                                >
                                  Edit comment
                                </button>
                              </MenuItem>
                              <MenuItem>
                                <button
                                  className="block w-full rounded-md px-2 py-2 text-left text-sm text-danger transition-colors hover:bg-surface data-[focus]:bg-surface"
                                  onClick={() => {
                                    deleteDiscussion({ id });
                                  }}
                                >
                                  Delete comment
                                </button>
                              </MenuItem>
                            </>
                          ) : (
                            <MenuItem>
                              <button
                                className="block w-full rounded-md px-2 py-2 text-left text-sm text-danger transition-colors hover:bg-surface data-[focus]:bg-surface"
                                onClick={() => {
                                  if (!session) {
                                    signIn();
                                    return;
                                  }
                                  openReport("discussion", id);
                                }}
                              >
                                Report comment
                              </button>
                            </MenuItem>
                          )}
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </div>

                  <div className="prose-sm overflow-x-hidden text-sm dark:prose-invert">
                    {Markdoc.renderers.react(content, React, {
                      components: markdocComponents,
                    })}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <VoteControl
                      base={
                        score -
                        (userVote === "up" ? 1 : userVote === "down" ? -1 : 0)
                      }
                      initial={userVote}
                      compact
                      onGate={!session ? () => signIn() : undefined}
                      onVote={(next) => voteDiscussion(id, next)}
                    />
                    {depth < 6 && (
                      <button
                        className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 text-sm font-medium text-muted transition-colors hover:border-strong hover:bg-hover hover:text-fg"
                        onClick={() => {
                          if (!session) return signIn();
                          setShowCommentBoxId((currentId) =>
                            currentId === id ? null : id,
                          );
                        }}
                      >
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        Reply
                      </button>
                    )}
                  </div>

                  {showCommentBoxId === id && (
                    <div className="mt-4">
                      <DiscussionEditor
                        onSubmit={async (markdown) => {
                          await handleCreateComment(markdown, id);
                          setShowCommentBoxId(null);
                        }}
                        onCancel={() => setShowCommentBoxId(null)}
                        autoExpand
                        placeholder="Write a reply..."
                        submitLabel="Reply"
                        disabled={createDiscussionStatus === "pending"}
                      />
                    </div>
                  )}

                  {/* Nested replies with curved connectors */}
                  {hasReplies && (
                    <div className="relative mt-2">
                      <div className="space-y-1">
                        {(sortDiscussions(children) || []).map(
                          (
                            child: (typeof children)[0],
                            index: number,
                            arr: typeof children,
                          ) => {
                            const isLast = index === arr.length - 1;
                            const isFirst = index === 0;
                            return (
                              <div key={child.id} className="relative">
                                {/* Vertical line from parent avatar area down to this curved connector */}
                                {isFirst && (
                                  <div
                                    className="absolute w-px bg-strong"
                                    style={{
                                      left: "-29px",
                                      top: "-90px",
                                      height: "98px",
                                    }}
                                  />
                                )}
                                {/* Curved connector from thread line to this reply */}
                                <div
                                  className="absolute border-b border-l border-strong"
                                  style={{
                                    left: "-29px",
                                    top: "0px",
                                    width: "21px",
                                    height: "16px",
                                    borderBottomLeftRadius: "8px",
                                  }}
                                />
                                {/* Vertical line continues to next reply (if not last) */}
                                {!isLast && (
                                  <div
                                    className="absolute w-px bg-strong"
                                    style={{
                                      left: "-29px",
                                      top: "15px",
                                      bottom: "-8px",
                                    }}
                                  />
                                )}
                                {generateDiscussions([child], depth + 1)}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <DiscussionEditor
                  onSubmit={async (markdown) => {
                    await handleEditComment(markdown, id);
                  }}
                  onCancel={() => {
                    setEditCommentBoxId(null);
                    setEditContent("");
                  }}
                  initialContent={editContent}
                  autoExpand
                  submitLabel="Update"
                  disabled={editStatus === "pending"}
                />
              </div>
            )}
          </section>
        );
      },
    );
  };

  const content = (
    <>
      {!initiallyLoaded && (
        <div
          className={`absolute bottom-0 left-0 right-0 top-0 z-20 ${noWrapper ? "" : "rounded-lg"} bg-canvas/80`}
        >
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-l-accent opacity-100" />
            <span className="sr-only">Loading</span>
          </div>
        </div>
      )}
      {/* Follow toggle + sort control (the canonical "Discussion {N}" header is
          owned by the reader) */}
      {initiallyLoaded && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followPending}
            aria-pressed={!!isFollowing}
            data-testid="discussion-follow"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
              isFollowing
                ? "border border-hairline text-fg hover:border-accent/50"
                : "bg-accent text-on-accent hover:bg-accent-soft"
            }`}
          >
            <span aria-hidden="true">{isFollowing ? "✓" : "＋"}</span>
            {isFollowing ? "Following" : "Follow"}
          </button>
          {(discussionsResponse?.count ?? 0) > 1 && (
            <FilterPill
              testId="discussion-sort"
              label="Sort comments"
              value={sortOrder}
              options={sortOptions}
              isDefault={sortOrder === "top"}
              align="right"
              onChange={(next) => setSortOrder(next as SortOrder)}
            />
          )}
        </div>
      )}
      <div className={discussions?.length ? "mb-8" : ""}>
        {session ? (
          <DiscussionEditor
            onSubmit={async (markdown) => {
              await handleCreateComment(markdown);
            }}
            placeholder="Add to the discussion…"
            submitLabel="Comment"
            disabled={createDiscussionStatus === "pending"}
          />
        ) : (
          <div className="rounded-lg border border-hairline bg-surface p-4 text-sm text-muted">
            <p className="font-medium text-fg">Got something to say?</p>
            <p className="mt-1">
              <button
                onClick={() => signIn()}
                className="font-medium text-accent-soft transition-colors hover:text-accent"
              >
                Sign in
              </button>{" "}
              or{" "}
              <button
                onClick={() => signIn()}
                className="font-medium text-accent-soft transition-colors hover:text-accent"
              >
                sign up
              </button>{" "}
              to join the conversation.
            </p>
          </div>
        )}
      </div>
      {discussions && discussions.length > 0 ? (
        <div className="flex flex-col gap-6">
          {generateDiscussions(discussions)}
        </div>
      ) : (
        initiallyLoaded && (
          <p className="py-2 text-sm text-faint">
            No comments yet — be the first to add to the discussion.
          </p>
        )
      )}
    </>
  );

  if (noWrapper) {
    return (
      <section
        className="relative w-full pt-6"
        data-testid="discussion-section"
      >
        {content}
      </section>
    );
  }

  return (
    <section
      className="relative w-full rounded-lg border border-hairline bg-surface p-6"
      data-testid="discussion-section"
    >
      {content}
    </section>
  );
};

export default DiscussionArea;
