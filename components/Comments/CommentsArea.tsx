"use client";

import React, { useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { Fragment, useState } from "react";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import Markdoc from "@markdoc/markdoc";
import { toast } from "sonner";
import z, { ZodError } from "zod";
import { HeartIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { EditCommentSchema } from "@/schema/comment";
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
  postId: string;
  postOwnerId: string;
}

const CommentsArea = ({ postId, postOwnerId }: Props) => {
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
    data: commentsResponse,
    refetch,
    status: commentStatus,
  } = api.comment.get.useQuery({
    postId,
  });
  const { mutate, status: createCommentStatus } =
    api.comment.create.useMutation({
      onSuccess: () => {
        refetch();
        setShowCommentBoxId(null);
      },
    });

  const { mutate: like, status: likeStatus } = api.comment.like.useMutation({
    onSettled() {
      refetch();
    },
  });

  const likeComment = async (commentId: number) => {
    if (!session) return signIn();
    if (likeStatus === "loading") return;
    try {
      await like({ commentId });
    } catch (err) {
      toast.error("Something went wrong, try again.");
    }
  };

  const comments = commentsResponse?.data;

  const { mutate: editComment, status: editStatus } =
    api.comment.edit.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const { mutate: deleteComment } = api.comment.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const firstChild = comments?.[0]?.children;

  type Comments = typeof comments;
  type Children = typeof firstChild;
  type FieldName = "comment" | "reply" | "edit";

  useEffect(() => {
    if (initiallyLoaded) {
      return;
    }
    setInitiallyLoaded(true);
  }, [commentStatus]);

  const onSubmit = async (
    body: string,
    parentId: number | undefined,
    fieldName: FieldName,
  ) => {
    // vaidate markdoc syntax
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
        EditCommentSchema.parse({ body, id: editCommentBoxId });
        if (typeof editCommentBoxId !== "number")
          throw new Error("Invalid edit.");
        await editComment({ body: body || "", id: editCommentBoxId });
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
      await mutate({ body: body || "", postId, parentId });
      resetField(fieldName);
      setViewPreviewId(null);
    } catch (err) {
      if (err instanceof ZodError) {
        return toast.error(err.issues[0].message);
      }
      toast.error("Something went wrong saving your comment.");
    }
  };

  const generateComments = (
    commentsArr: Comments | Children | undefined,
    depth = 0,
  ) => {
    if (!commentsArr) return null;
    return commentsArr.map(
      ({
        body,
        createdAt,
        updatedAt,
        id,
        youLikedThis,
        likeCount,
        user: { name, image, username, id: userId },
        children,
      }) => {
        const ast = Markdoc.parse(body);
        const content = Markdoc.transform(ast, config);
        const isCurrentUser = session?.user?.id === userId;
        const isAuthor = userId === postOwnerId;
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

        const commentUpdated =
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
                    {isCurrentUser && !isAuthor && (
                      <div className="rounded border border-orange-400 px-1 py-[2px] text-xs text-orange-400">
                        YOU
                      </div>
                    )}
                    {isAuthor && (
                      <div className="rounded border border-pink-500 px-1 py-[2px] text-xs text-pink-500">
                        AUTHOR
                      </div>
                    )}
                    <span aria-hidden="true">&middot;</span>
                    <time>{readableDate}</time>

                    {commentUpdated ? (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <div>Edited</div>
                      </>
                    ) : null}
                  </div>
                  {isCurrentUser ? (
                    <Menu as="div" className="relative">
                      <div>
                        <Menu.Button className="rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800">
                          <span className="sr-only">Open user menu</span>
                          <EllipsisHorizontalIcon className="h-6 w-6" />
                        </Menu.Button>
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
                        <Menu.Items className="absolute bottom-10 right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <>
                            <Menu.Item>
                              <button
                                className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200"
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
                            </Menu.Item>
                            <Menu.Item>
                              <button
                                className="block w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200"
                                onClick={() => {
                                  deleteComment({ id });
                                }}
                              >
                                Delete comment
                              </button>
                            </Menu.Item>
                          </>
                        </Menu.Items>
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

                  <div className="mb-4 mt-2 flex items-center">
                    <button
                      className="mr-1 rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-800"
                      onClick={() => likeComment(id)}
                    >
                      <HeartIcon
                        className={`w-6 h-6${
                          youLikedThis
                            ? " fill-red-400"
                            : " fill-neutral-400 dark:fill-neutral-600"
                        }`}
                      />
                    </button>
                    <span className="mr-4 flex text-xs font-semibold">
                      {likeCount}
                    </span>
                    <ReportModal type="comment" comment={body} id={id} />
                    {depth < 6 && (
                      <button
                        className="rounded border border-neutral-800 px-2 py-1 text-xs hover:bg-neutral-300 dark:border-white dark:hover:bg-neutral-800"
                        onClick={() => {
                          if (!session) return signIn();
                          if (showCommentBoxId !== id) {
                            // TODO: Add alert to confirm reset if there is already content being written
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
                        <CommentArea
                          id={id}
                          name="reply"
                          parentId={id}
                          onCancel={() => {
                            // TODO: Add alert to confirm reset if there is already content being written
                            resetField("reply");
                            setShowCommentBoxId(null);
                          }}
                          loading={createCommentStatus === "loading"}
                        />
                      </div>
                    )}
                  </>
                  {!!children && generateComments(children, depth + 1)}
                </div>
              </>
            ) : (
              <CommentArea
                name="edit"
                id={id}
                editMode
                loading={editStatus === "loading"}
                onCancel={() => setEditCommentBoxId(null)}
              />
            )}
          </section>
        );
      },
    );
  };

  interface CommentAreaProps {
    onCancel?: () => void;
    parentId?: number;
    id: number | null;
    name: FieldName;
    editMode?: boolean;
    loading?: boolean;
  }

  const CommentArea = ({
    onCancel,
    parentId,
    id,
    name,
    editMode = false,
    loading = false,
  }: CommentAreaProps) => {
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
            disabled={createCommentStatus === "loading"}
            type="submit"
            className="primary-button border-2 text-sm text-neutral-300 hover:text-white"
          >
            {editMode ? "Update" : "Submit"}
          </button>
          <button
            disabled={createCommentStatus === "loading"}
            type="submit"
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
    <section className="relative w-full">
      {!initiallyLoaded && (
        <div className="absolute bottom-0 left-0 right-0 top-0 z-20">
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-700 border-l-neutral-500 opacity-100" />
            <span className="sr-only">Loading</span>
          </div>
        </div>
      )}
      <h2 className="mt-4 border-b border-neutral-800 pb-2 text-xl">
        {initiallyLoaded
          ? `Discussion (${commentsResponse?.count || 0})`
          : "Fetching comments"}
      </h2>
      <div className="mt-4">
        {session ? (
          <CommentArea id={0} name="comment" />
        ) : (
          <div className="mb-4 border-b border-neutral-800 pb-4 text-lg">
            <p className="mb-2">Hey! 👋</p>
            <p className="mb-2">Got something to say?</p>
            <p>
              <button onClick={() => signIn()} className="fancy-link">
                Sign in
              </button>{" "}
              or{" "}
              <button onClick={() => signIn()} className="fancy-link">
                sign up
              </button>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>
      <div className="mb-8">{generateComments(comments)}</div>
    </section>
  );
};

export default CommentsArea;
