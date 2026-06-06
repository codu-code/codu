"use client";

import React, { useState } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
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
import { DiscussionEditor } from "./DiscussionEditor";

interface Props {
  contentId: string;
  noWrapper?: boolean;
}

type SortOrder = "top" | "new";

const DiscussionArea = ({ contentId, noWrapper = false }: Props) => {
  const [showCommentBoxId, setShowCommentBoxId] = useState<string | null>(null);
  const [editCommentBoxId, setEditCommentBoxId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("top");

  const { data: session } = useSession();
  const { openReport } = useReportModal();

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

  // Sort discussions based on selected sort order
  const sortDiscussions = (
    items: Discussions | Children | undefined,
  ): typeof items => {
    if (!items) return items;
    const sorted = [...items].sort((a, b) => {
      if (sortOrder === "top") {
        return b.score - a.score;
      }
      // "new" - sort by createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return sorted as typeof items;
  };

  // Derive initial load state from query status - data exists means loaded at least once
  const initiallyLoaded = discussionStatus === "success" || !!discussions;

  const handleCreateComment = async (body: string, parentId?: string) => {
    // validate markdoc syntax
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
    // validate markdoc syntax
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
          <section key={id} className="group/comment">
            {editCommentBoxId !== id ? (
              <div className="flex">
                {/* Avatar column - no self-stretch, just contains avatar */}
                <div
                  className="relative mr-3 flex-shrink-0"
                  style={{ width: "32px" }}
                >
                  <Link href={`/${username}`}>
                    <img
                      className="h-8 w-8 rounded-full bg-neutral-700 object-cover"
                      alt={`Avatar for ${name}`}
                      src={image}
                    />
                  </Link>
                </div>

                {/* Content column */}
                <div className="min-w-0 flex-1 pb-2">
                  {/* Header row */}
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                      <Link
                        className="font-semibold text-neutral-900 hover:underline dark:text-white"
                        href={`/${username}`}
                      >
                        {name}
                      </Link>
                      {isCurrentUser && (
                        <span className="rounded border border-accent px-1 py-[1px] text-xs text-accent">
                          YOU
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <time>{readableDate}</time>
                      {discussionUpdated && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Edited</span>
                        </>
                      )}
                    </div>
                    <Menu as="div" className="relative">
                      <MenuButton className="rounded-full p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
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
                        <MenuItems className="absolute right-0 top-8 z-10 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-800">
                          {isCurrentUser ? (
                            <>
                              <MenuItem>
                                <button
                                  className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 data-[focus]:bg-neutral-100 data-[focus]:text-black dark:text-neutral-200 dark:hover:bg-neutral-700 dark:data-[focus]:bg-neutral-700 dark:data-[focus]:text-white"
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
                                  className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 data-[focus]:bg-neutral-100 data-[focus]:text-black dark:text-neutral-200 dark:hover:bg-neutral-700 dark:data-[focus]:bg-neutral-700 dark:data-[focus]:text-white"
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
                                className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 data-[focus]:bg-neutral-100 data-[focus]:text-black dark:text-neutral-200 dark:hover:bg-neutral-700 dark:data-[focus]:bg-neutral-700 dark:data-[focus]:text-white"
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

                  {/* Comment body */}
                  <div className="prose-sm overflow-x-hidden text-sm dark:prose-invert">
                    {Markdoc.renderers.react(content, React, {
                      components: markdocComponents,
                    })}
                  </div>

                  {/* Action bar */}
                  <div className="mt-2 flex items-center gap-2">
                    {/* Vote buttons */}
                    <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() =>
                          voteDiscussion(id, userVote === "up" ? null : "up")
                        }
                        disabled={voteStatus === "pending"}
                        className={`rounded-l-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                          userVote === "up"
                            ? "text-green-500"
                            : "text-neutral-400 dark:text-neutral-500"
                        }`}
                        aria-label="Upvote"
                      >
                        <ChevronUpIcon className="h-5 w-5" />
                      </button>
                      <span
                        className={`min-w-[2rem] text-center text-sm font-semibold ${
                          score > 0
                            ? "text-green-500"
                            : score < 0
                              ? "text-red-500"
                              : "text-neutral-400 dark:text-neutral-500"
                        }`}
                      >
                        {score}
                      </span>
                      <button
                        onClick={() =>
                          voteDiscussion(
                            id,
                            userVote === "down" ? null : "down",
                          )
                        }
                        disabled={voteStatus === "pending"}
                        className={`rounded-r-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                          userVote === "down"
                            ? "text-red-500"
                            : "text-neutral-400 dark:text-neutral-500"
                        }`}
                        aria-label="Downvote"
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {depth < 6 && (
                      <button
                        className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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

                  {/* Reply editor */}
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
                                    className="absolute w-px bg-neutral-400 dark:bg-neutral-600"
                                    style={{
                                      left: "-29px",
                                      top: "-90px",
                                      height: "98px",
                                    }}
                                  />
                                )}
                                {/* Curved connector from thread line to this reply */}
                                <div
                                  className="absolute border-b border-l border-neutral-400 dark:border-neutral-600"
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
                                    className="absolute w-px bg-neutral-400 dark:bg-neutral-600"
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
          className={`absolute bottom-0 left-0 right-0 top-0 z-20 ${noWrapper ? "" : "rounded-lg"} bg-white/80 dark:bg-neutral-900/80`}
        >
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-l-neutral-500 opacity-100" />
            <span className="sr-only">Loading</span>
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ChatBubbleLeftIcon className="h-5 w-5" />
          {initiallyLoaded
            ? `Discussion (${discussionsResponse?.count || 0})`
            : "Loading discussion..."}
        </h2>
        {initiallyLoaded && (discussionsResponse?.count ?? 0) > 1 && (
          <div className="flex items-center gap-1 text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">
              Sort:
            </span>
            <button
              onClick={() => setSortOrder("top")}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                sortOrder === "top"
                  ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setSortOrder("new")}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                sortOrder === "new"
                  ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              New
            </button>
          </div>
        )}
      </div>
      <div className={discussions?.length ? "mb-6" : ""}>
        {session ? (
          <DiscussionEditor
            onSubmit={async (markdown) => {
              await handleCreateComment(markdown);
            }}
            placeholder="Join the conversation..."
            submitLabel="Comment"
            disabled={createDiscussionStatus === "pending"}
          />
        ) : (
          <div className="mb-4 text-base">
            <p className="mb-2">Hey! 👋</p>
            <p className="mb-2">Got something to say?</p>
            <p>
              <button
                onClick={() => signIn()}
                className="cursor-pointer bg-gradient-to-r from-accent to-accent bg-clip-text tracking-wide text-transparent hover:from-accent hover:to-accent"
              >
                Sign in
              </button>{" "}
              or{" "}
              <button
                onClick={() => signIn()}
                className="cursor-pointer bg-gradient-to-r from-accent to-accent bg-clip-text tracking-wide text-transparent hover:from-accent hover:to-accent"
              >
                sign up
              </button>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>
      <div className="mb-4">{generateDiscussions(discussions)}</div>
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
      className="relative w-full rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="discussion-section"
    >
      {content}
    </section>
  );
};

export default DiscussionArea;
