import React, { useRef, useState } from "react";
import Flag from "../../icons/flag.svg";
import { XIcon } from "@heroicons/react/outline";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { api } from "@/server/trpc/react";
import { Dialog } from "@headlessui/react";

type Props = Post | Comment;

type Post = {
  type: "post";
  title: string;
  id: string;
};

type Comment = {
  type: "comment";
  comment: string;
  id: number;
};

export const ReportModal = (props: Props) => {
  const { mutate: sendEmail } = api.report.send.useMutation({
    onSuccess: () => {
      toast.success("Report sent");
    },
    onError: () => {
      toast.error("Oops, something went wrong.");
    },
  });

  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [reportBody, setReportBody] = useState("");
  const textAreaRef = useRef(null);

  const { type, id } = props;

  const isComment = type === "comment" && typeof id === "number";
  const isPost = type === "post" && typeof id === "string";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!session) return signIn();

      if (isComment) {
        await sendEmail({
          type,
          body: reportBody,
          id,
        });
      }

      if (isPost) {
        await sendEmail({
          type,
          body: reportBody,
          id,
        });
      }

      setIsModalOpen(false);
      setReportBody("");
      setLoading(false);

      if (!isComment && !isPost) {
        throw new Error("Invalid report");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try submit report again.");
    }
  };

  return (
    <>
      {isComment && (
        <button
          aria-label="flag comment"
          onClick={() => {
            session ? setIsModalOpen(true) : signIn();
          }}
          className="mr-4 flex p-1.5 rounded-full hover:bg-neutral-800"
        >
          <Flag className="h-5 " />
        </button>
      )}

      {!isComment && (
        <div className="w-full">
          <button
            onClick={() => (session ? setIsModalOpen(true) : signIn())}
            className="rounded text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200"
          >
            Report Article
          </button>
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialFocus={textAreaRef}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-700/90" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <Dialog.Panel className="p-0 border bg-neutral-900 text-neutral-400 max-w-lg rounded-lg relative ">
            <div className="m-8">
              <Dialog.Title className="text-2xl tracking-tight font-bold text-neutral-50 text-center">
                Submit a report
              </Dialog.Title>

              <Dialog.Description as="div">
                <p className="m-4 ml-0">
                  Is {isPost ? "something in this article" : "this comment"}{" "}
                  inappropriate?
                </p>
                <p className="border p-4  bg-neutral-700 text-zinc-200 rounded">
                  <span>{isPost ? "Article : " : "Comment : "}</span>
                  {isComment && props.comment}
                  {isPost && props.title}
                </p>
              </Dialog.Description>

              <p className="m-4 ml-0">
                Thank you for bringing it to our attention. We take reports very
                seriously and will thoroughly investigate the matter.
              </p>

              <form>
                <label htmlFor="report-comment">Leave a comment</label>
                <textarea
                  maxLength={300}
                  id="report-comment"
                  rows={3}
                  placeholder="type...."
                  onChange={(e) => setReportBody(e.target.value)}
                  value={reportBody}
                  className="rounded"
                  ref={textAreaRef}
                />

                <div className="flex justify-end text-sm mt-8">
                  <button
                    disabled={loading}
                    className="primary-button uppercase"
                    type="submit"
                    onClick={handleSubmit}
                  >
                    Submit report
                  </button>
                </div>
              </form>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal"
              className="absolute top-6 right-6 p-1 hover:bg-neutral-800 rounded-full"
            >
              <XIcon className="w-8" />
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};
