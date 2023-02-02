import { Menu, Transition } from "@headlessui/react";
import { DotsHorizontalIcon } from "@heroicons/react/solid";
import { useSession } from "next-auth/react";
import { Fragment, useState } from "react";
import { trpc } from "../../utils/trpc";
import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";
import Markdoc from "@markdoc/markdoc";
import React from "react";

interface Props {
  postId: string;
}

const CommentsTab = ({ postId }: Props) => {
  const [showCommentBoxId, setShowCommentBoxId] = useState<number | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const { data: commentsResponse, refetch } = trpc.comment.get.useQuery({
    postId,
  });
  const { mutate, status } = trpc.comment.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCommentBoxId(null);
    },
  });

  const comments = commentsResponse?.data;

  const { mutate: deleteComment, status: deleteStatus } =
    trpc.comment.delete.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const firstChild = comments?.[0]?.children;

  type Comments = typeof comments;
  type Children = typeof firstChild;

  const generateComments = (
    commentsArr: Comments | Children | undefined,
    depth = 0
  ) => {
    if (!commentsArr) return null;
    return commentsArr.map(
      ({ body, id, user: { name, image, username }, children }) => {
        const ast = Markdoc.parse(body);
        const content = Markdoc.transform(ast, config);

        {
          Markdoc.renderers.react(content, React, {
            components: markdocComponents,
          });
        }
        return (
          <div key={id}>
            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center">
                <img
                  className="mr-2 rounded-full object-cover bg-slate-700 h-8 w-8"
                  alt={`Avatar for ${name}`}
                  src={image}
                />
                <div className="text-sm">{name}</div>
                {session?.user?.username === username && (
                  <div className="ml-2 border rounded text-xs px-1 py-[2px] border-slate-500 text-slate-500">
                    YOU
                  </div>
                )}
              </div>
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="p-1 rounded-full hover:bg-slate-800">
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
                    {session?.user?.username === username ? (
                      <Menu.Item>
                        <button
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded w-full text-left text-sm"
                          onClick={() => {
                            deleteComment({ id });
                          }}
                        >
                          Delete post
                        </button>
                      </Menu.Item>
                    ) : null}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
            <div className="border-l-2 border-slate-700 ml-4 pl-2">
              {body}
              {depth < 6 && (
                <div className="flex justify-between text-sm mt-2 mb-4">
                  <button
                    className="border border-white px-2 py-1 text-xs mt-2 rounded"
                    onClick={() =>
                      setShowCommentBoxId((currentId) =>
                        currentId === id ? null : id
                      )
                    }
                  >
                    Reply
                  </button>
                </div>
              )}
              <>
                {showCommentBoxId === id && (
                  <div className="mt-4">
                    <CommentArea
                      parentId={id}
                      onCancel={() => setShowCommentBoxId(null)}
                    />
                  </div>
                )}
              </>
              {!!children && generateComments(children, depth + 1)}
            </div>
          </div>
        );
      }
    );
  };

  interface CommentAreaProps {
    onCancel?: () => void;
    parentId?: number;
  }

  const CommentArea = ({ onCancel, parentId }: CommentAreaProps) => {
    return (
      <form
        className="mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          mutate({ body: "Hello world" + parentId, postId, parentId });
        }}
      >
        {session?.user?.image && (
          <div className="flex items-center mb-2">
            <img
              className="mr-2 rounded-full object-cover bg-slate-700 h-8 w-8"
              alt={`Avatar for ${session.user.name}`}
              src={session.user.image}
            />
            <div>{session.user.name}</div>
          </div>
        )}
        <textarea
          className="p-2 w-full mb-2 bg-black rounded"
          placeholder="What do you think?"
          rows={4}
        />
        <div className="flex items-center">
          <button
            type="submit"
            className="text-gray-300 border-2 hover:text-white primary-button text-sm"
          >
            Comment
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
    <section className="w-full bg-smoke border-2 border-white z-20 ">
      <h2 className="mx-4 mt-6 pb-2 text-xl border-b border-gray-800">{`Comments (${commentsResponse?.count})`}</h2>
      <div className="mx-4 mt-4">
        <CommentArea />
      </div>
      <div className="mx-4 mb-8">{generateComments(comments)}</div>
    </section>
  );
};

export default CommentsTab;
