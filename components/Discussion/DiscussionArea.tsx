"use client";

import React, { useEffect } from "react";
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
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { Fragment, useState } from "react";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import Markdoc from "@markdoc/markdoc";
import { toast } from "sonner";
import z, { ZodError } from "zod";
import { ChatBubbleLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { EditDiscussionSchema } from "@/schema/discussion";
import { api } from "@/server/trpc/react";
import { ReportModal } from "@/components/ReportModal/ReportModal";

const SaveSchema = z.object({
  body: z
    .string()
    .min(1, "Comment can't be empty!")
    .max(5000, "We have a character limit of 5000 for comments.")
    .trim()
    .optional(),
});

export type SaveInput = {
  comment: string;
  reply: string;
  edit: string;
};

interface Props {
  targetType: "POST" | "ARTICLE";
  postId?: string;
  articleId?: number;
}

const DiscussionArea = ({ targetType, postId, articleId }: Props) => {
  const [showCommentBoxId, setShowCommentBoxId] = useState<number | null>(null);
  const [editCommentBoxId, setEditCommentBoxId] = useState<number | null>(null);
  const [viewPreviewId, setViewPreviewId] = useState<number | null>(null);
  const [initiallyLoaded, setInitiallyLoaded] = useState<boolean>(false);

  const { data: session } = useSession();

  const { handleSubmit, register, getValues, resetField, setValue } =
    useForm<SaveInput>({
      mode: "onSubmit",
      defaultValues: {
        comment: "",
        reply: "",
        edit: "",
      },
    });

  const {
    data: discussionsResponse,
    refetch,
    status: discussionStatus,
  } = api.discussion.get.useQuery({
    targetType,
    postId,
    articleId,
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

  const voteDiscussion = (discussionId: number, voteType: "UP" | "DOWN" | null) => {
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
  type FieldName = "comment" | "reply" | "edit";

  useEffect(() => {
    if (initiallyLoaded) {
      return;
    }
    setInitiallyLoaded(true);
  }, [discussionStatus]);

  const onSubmit = async (
    body: string,
    parentId: number | undefined,
    fieldName: FieldName,
  ) => {
    // validate markdoc syntax
    const ast = Markdoc.parse(body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical",
    );

    if (errors.length > 0) {
      errors.forEach((err) => {
        toast.error(err.error.message);
      });
      return;
    }

    if (fieldName === "edit") {
      try {
        EditDiscussionSchema.parse({ body, id: editCommentBoxId });
        if (typeof editCommentBoxId !== "number")
          throw new Error("Invalid edit.");
        await editDiscussion({ body: body || "", id: editCommentBoxId });
        resetField(fieldName);
        setEditCommentBoxId(null);
        setViewPreviewId(null);
        return;
      } catch (err) {
        if (err instanceof ZodError) {
          return toast.error(err.issues[0].message);
        }
        toast.error("Something went wrong editing your comment.");
      }
    }

    try {
      SaveSchema.parse({ body });
      await mutate({
        body: body || "",
        targetType,
        postId,
        articleId,
        parentId,
      });
      resetField(fieldName);
      setViewPreviewId(null);
    } catch (err) {
      if (err instanceof ZodError) {
        return toast.error(err.issues[0].message);
      }
      toast.error("Something went wrong saving your comment.");
    }
  };

  const generateDiscussions = (
    discussionsArr: Discussions | Children | undefined,
    depth = 0,
  ) => {
    if (!discussionsArr) return null;
    return discussionsArr.map(
      ({
        body,
        createdAt,
        updatedAt,
        id,
        youLikedThis,
        likeCount,
        userVote,
        score,
        upvotes,
        downvotes,
        user: { name, image, username, id: odiserId },
        children,
      }: {
        body: string;
        createdAt: string;
        updatedAt: string;
        id: number;
        youLikedThis: boolean;
        likeCount: number;
        userVote: "UP" | "DOWN" | null;
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
        return (
          <section key={id}>
            {editCommentBoxId !== id ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-neutral-700 dark:text-neutral-500">
                    <Link href={`/${username}`}>
                      <img
                        className="h-8 w-8 rounded-full bg-neutral-700 object-cover"
                        alt={`Avatar for ${name}`}
                        src={image}
                      />
                    </Link>
                    <Link
                      className="font-semibold text-neutral-900 hover:underline dark:text-white"
                      href={`/${username}`}
                    >
                      {name}
                    </Link>
                    {isCurrentUser && (
                      <div className="rounded border border-orange-400 px-1 py-[2px] text-xs text-orange-400">
                        YOU
                      </div>
                    )}
                    <span aria-hidden="true">&middot;</span>
                    <time>{readableDate}</time>

                    {discussionUpdated ? (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <div>Edited</div>
                      </>
                    ) : null}
                  </div>
                  {isCurrentUser ? (
                    <Menu as="div" className="relative">
                      <div>
                        <MenuButton className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800">
                          <span className="sr-only">Open user menu</span>
                          <EllipsisHorizontalIcon className="h-6 w-6" />
                        </MenuButton>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute bottom-10 right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <>
                            <MenuItem>
                              <button
                                className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 data-[focus]:bg-neutral-100 data-[focus]:text-black"
                                onClick={() => {
                                  if (id !== editCommentBoxId) {
                                    setValue("edit", body);
                                  }
                                  setEditCommentBoxId(id);
                                  setShowCommentBoxId(null);
                                }}
                              >
                                Edit comment
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 data-[focus]:bg-neutral-100 data-[focus]:text-black"
                                onClick={() => {
                                  deleteDiscussion({ id });
                                }}
                              >
                                Delete comment
                              </button>
                            </MenuItem>
                          </>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  ) : null}
                </div>

                <div className="-mt-2 ml-4 border-l-2 border-neutral-400 pl-2 dark:border-neutral-700">
                  <div className="prose-sm overflow-x-hidden text-sm dark:prose-invert">
                    {Markdoc.renderers.react(content, React, {
                      components: markdocComponents,
                    })}
                  </div>

                  <div className="mb-4 mt-2 flex items-center gap-2">
                    {/* Vote buttons */}
                    <div className="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() =>
                          voteDiscussion(id, userVote === "UP" ? null : "UP")
                        }
                        disabled={voteStatus === "pending"}
                        className={`rounded-l-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                          userVote === "UP"
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
                          voteDiscussion(id, userVote === "DOWN" ? null : "DOWN")
                        }
                        disabled={voteStatus === "pending"}
                        className={`rounded-r-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-neutral-800 ${
                          userVote === "DOWN"
                            ? "text-red-500"
                            : "text-neutral-400 dark:text-neutral-500"
                        }`}
                        aria-label="Downvote"
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <ReportModal type="discussion" comment={body} id={id} />
                    {depth < 6 && (
                      <button
                        className="rounded border border-neutral-800 px-2 py-1 text-xs hover:bg-neutral-300 dark:border-white dark:hover:bg-neutral-800"
                        onClick={() => {
                          if (!session) return signIn();
                          if (showCommentBoxId !== id) {
                            resetField("reply");
                            setShowCommentBoxId((currentId) =>
                              currentId === id ? null : id,
                            );
                          }
                        }}
                      >
                        Reply
                      </button>
                    )}
                  </div>

                  <>
                    {showCommentBoxId === id && (
                      <div className="mt-4">
                        <DiscussionInput
                          id={id}
                          name="reply"
                          parentId={id}
                          onCancel={() => {
                            resetField("reply");
                            setShowCommentBoxId(null);
                          }}
                          loading={createDiscussionStatus === "pending"}
                        />
                      </div>
                    )}
                  </>
                  {!!children && generateDiscussions(children, depth + 1)}
                </div>
              </>
            ) : (
              <DiscussionInput
                name="edit"
                id={id}
                editMode
                loading={editStatus === "pending"}
                onCancel={() => setEditCommentBoxId(null)}
              />
            )}
          </section>
        );
      },
    );
  };

  interface DiscussionInputProps {
    onCancel?: () => void;
    parentId?: number;
    id: number | null;
    name: FieldName;
    editMode?: boolean;
    loading?: boolean;
  }

  const DiscussionInput = ({
    onCancel,
    parentId,
    id,
    name,
    editMode = false,
    loading = false,
  }: DiscussionInputProps) => {
    return (
      <form
        className="relative mb-8"
        onSubmit={handleSubmit((e) => onSubmit(e[name], parentId, name))}
      >
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 top-0">
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-l-neutral-500 opacity-100" />
            </div>
          </div>
        )}
        {session?.user?.image && (
          <div className="mb-2 flex items-center">
            <img
              className="mr-2 h-8 w-8 rounded-full bg-neutral-700 object-cover"
              alt={`Avatar for ${session.user.name}`}
              src={session.user.image}
            />
            <div>{session.user.name}</div>
          </div>
        )}
        {viewPreviewId === id ? (
          <article
            className="prose-sm prose-invert overflow-x-hidden text-sm"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {Markdoc.renderers.react(
              Markdoc.transform(Markdoc.parse(getValues()[name]), config),
              React,
              {
                components: markdocComponents,
              },
            )}
          </article>
        ) : (
          <>
            <label htmlFor={name} className="sr-only">
              What do you think?
            </label>
            <TextareaAutosize
              {...register(name)}
              id={name}
              minLength={1}
              className="mb-2 w-full rounded bg-neutral-300 p-2 dark:bg-black"
              placeholder="What do you think?"
              minRows={3}
            />
          </>
        )}
        <div className="flex">
          <button
            disabled={createDiscussionStatus === "pending"}
            type="submit"
            className="primary-button border-2 text-sm text-neutral-300 hover:text-white"
          >
            {editMode ? "Update" : "Submit"}
          </button>
          <button
            disabled={createDiscussionStatus === "pending"}
            type="button"
            className="secondary-button ml-2 text-sm"
            onClick={() =>
              setViewPreviewId((current) => {
                if (current === id) return null;
                return id;
              })
            }
          >
            {viewPreviewId === id ? "Edit" : "Preview"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="ml-2 px-4 py-2 text-sm opacity-60 hover:opacity-100"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  return (
    <section className="relative w-full rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
      {!initiallyLoaded && (
        <div className="absolute bottom-0 left-0 right-0 top-0 z-20 rounded-lg bg-white/80 dark:bg-neutral-900/80">
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-l-neutral-500 opacity-100" />
            <span className="sr-only">Loading</span>
          </div>
        </div>
      )}
      <h2 className="mb-4 flex items-center gap-2 border-b border-neutral-200 pb-2 text-lg font-semibold dark:border-neutral-700">
        <ChatBubbleLeftIcon className="h-5 w-5" />
        {initiallyLoaded
          ? `Discussion (${discussionsResponse?.count || 0})`
          : "Loading discussion..."}
      </h2>
      <div className="mt-4">
        {session ? (
          <DiscussionInput id={0} name="comment" />
        ) : (
          <div className="mb-4 border-b border-neutral-200 pb-4 text-base dark:border-neutral-700">
            <p className="mb-2">Hey! 👋</p>
            <p className="mb-2">Got something to say?</p>
            <p>
              <button
                onClick={() => signIn()}
                className="cursor-pointer bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text tracking-wide text-transparent hover:from-orange-300 hover:to-pink-500"
              >
                Sign in
              </button>{" "}
              or{" "}
              <button
                onClick={() => signIn()}
                className="cursor-pointer bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text tracking-wide text-transparent hover:from-orange-300 hover:to-pink-500"
              >
                sign up
              </button>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>
      <div className="mb-4">{generateDiscussions(discussions)}</div>
    </section>
  );
};

export default DiscussionArea;
