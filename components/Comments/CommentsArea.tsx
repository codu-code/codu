import React, { useEffect } from "react";
import { Menu, Transition } from "@headlessui/react";
import { DotsHorizontalIcon } from "@heroicons/react/solid";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import { Fragment, useState } from "react";
import { trpc } from "../../utils/trpc";
import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";
import Markdoc from "@markdoc/markdoc";
import toast, { Toaster } from "react-hot-toast";
import z, { ZodError } from "zod";
import { HeartIcon } from "@heroicons/react/outline";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { EditCommentSchema } from "../../schema/comment";

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
  } = trpc.comment.get.useQuery({
    postId,
  });
  const { mutate, status: createCommentStatus } =
    trpc.comment.create.useMutation({
      onSuccess: () => {
        refetch();
        setShowCommentBoxId(null);
      },
    });

  const { mutate: like, status: likeStatus } = trpc.comment.like.useMutation({
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
    trpc.comment.edit.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const { mutate: deleteComment } = trpc.comment.delete.useMutation({
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
        const isCurrentUser = session?.user?.username === username;
        const isAuthor = userId === postOwnerId;
        const dateTime = Temporal.Instant.from(createdAt.toISOString());
        const isCurrentYear =
          new Date().getFullYear() === createdAt.getFullYear();
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
                <div className="flex items-center mb-2 justify-between">
                  <div className="flex items-center space-x-2 text-sm text-neutral-500">
                    <Link href={`/${username}`}>
                      <img
                        className="rounded-full object-cover bg-neutral-700 h-8 w-8"
                        alt={`Avatar for ${name}`}
                        src={image}
                      />
                    </Link>
                    <Link
                      className="hover:underline text-white"
                      href={`/${username}`}
                    >
                      {name}
                    </Link>
                    {isCurrentUser && !isAuthor && (
                      <div className="border rounded text-xs px-1 py-[2px] border-orange-400 text-orange-400">
                        YOU
                      </div>
                    )}
                    {isAuthor && (
                      <div className="border rounded text-xs px-1 py-[2px] border-pink-500 text-pink-500">
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
                        <Menu.Button className="p-1 rounded-full hover:bg-neutral-800 bg-neutral-900">
                          <span className="sr-only">Open user menu</span>
                          <DotsHorizontalIcon className="w-6 h-6" />
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
                        <Menu.Items className="origin-top-right absolute bottom-10 right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                          <>
                            <Menu.Item>
                              <button
                                className="block px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded w-full text-left text-sm"
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
                                className="block px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded w-full text-left text-sm"
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

                <div className="border-l-2 border-neutral-700 ml-4 pl-2 -mt-2">
                  <div className="prose prose-invert text-sm overflow-x-scroll">
                    {Markdoc.renderers.react(content, React, {
                      components: markdocComponents,
                    })}
                  </div>

                  <div className="flex items-center mt-2 mb-4">
                    <button
                      className="p-1 mr-1 rounded-full hover:bg-neutral-800"
                      onClick={() => likeComment(id)}
                    >
                      <HeartIcon
                        className={`w-6 h-6${
                          youLikedThis ? " fill-red-400" : ""
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold mr-4 flex">
                      {likeCount}
                    </span>
                    {depth < 6 && (
                      <button
                        className="border border-white px-2 py-1 text-xs rounded hover:bg-neutral-800"
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
        className="mb-8 relative"
        onSubmit={handleSubmit((e) => onSubmit(e[name], parentId, name))}
      >
        {loading && (
          <div className="top-0 bottom-0 left-0 right-0 absolute">
            <div className="flex justify-center items-center h-full">
              <div className="border-4 border-neutral-700 border-l-neutral-500 animate-spin rounded-full h-8 w-8 opacity-100" />
            </div>
          </div>
        )}
        {session?.user?.image && (
          <div className="flex items-center mb-2">
            <img
              className="mr-2 rounded-full object-cover bg-neutral-700 h-8 w-8"
              alt={`Avatar for ${session.user.name}`}
              src={session.user.image}
            />
            <div>{session.user.name}</div>
          </div>
        )}
        {viewPreviewId === id ? (
          <article
            className="prose prose-invert text-sm overflow-x-scroll"
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
          <TextareaAutosize
            {...register(name)}
            minLength={1}
            className="p-2 w-full mb-2 bg-black rounded"
            placeholder="What do you think?"
            minRows={3}
          />
        )}
        <div className="flex items-center">
          <button
            disabled={createCommentStatus === "loading"}
            type="submit"
            className=" text-neutral-300 border-2 hover:text-white primary-button text-sm"
          >
            {editMode ? "Update" : "Submit"}
          </button>
          <button
            disabled={createCommentStatus === "loading"}
            type="submit"
            className="secondary-button text-sm ml-2"
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
              className="text-sm opacity-60 hover:opacity-100 px-4 py-2 ml-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  return (
    <section className="w-full relative">
      {!initiallyLoaded && (
        <div className="top-0 bottom-0 left-0 right-0 absolute z-20">
          <div className="flex justify-center items-center h-full">
            <div className="border-4 border-neutral-700 border-l-neutral-500 animate-spin rounded-full h-8 w-8 opacity-100" />
            <span className="sr-only">Loading</span>
          </div>
        </div>
      )}
      <h2 className="mt-4 pb-2 text-xl border-b border-neutral-800">
        {initiallyLoaded
          ? `Discussion (${commentsResponse?.count || 0})`
          : "Fetching comments"}
      </h2>
      <div className="mt-4">
        {session ? (
          <CommentArea id={0} name="comment" />
        ) : (
          <div className="mb-4 text-lg pb-4 border-b border-neutral-800">
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
      <Toaster
        toastOptions={{
          style: {
            borderRadius: 0,
            border: "2px solid black",
            background: "white",
          },
        }}
      />
    </section>
  );
};

export default CommentsArea;
