import React, { useRef, useState } from "react";
import Flag from "../../icons/flag.svg";
import { XIcon } from "@heroicons/react/outline";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { createCommentReportEmailTemplate } from "../../utils/createCommentReportEmailTemplate";
import { api } from "@/server/trpc/react";
import { createArticleReportEmailTemplate } from "@/utils/createArticleReportEmailTemplate";
import { Dialog } from "@headlessui/react";

interface CommonProps {
  name: string;
}

interface Article extends CommonProps {
  postTitle: string;
  postId: string;
  postUrl: string;
  postUsername: string;
}

interface Comment extends CommonProps {
  body: string;
  id: number;
  email: string | null;
  slug: string;
}

type Props = Article | Comment;

export const ReportComments = (props: Props) => {
  const { mutate: sendEmail } = api.emailReport.send.useMutation({
    onSuccess: () => {
      toast.success("Report sent");
    },
    onError: () => {
      toast.error(
        "Oops, something went wrong, please send us a message on github https://github.com/codu-code/codu",
      );
    },
  });

  const { data: session } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [comment, setComment] = useState("");
  let textAreaRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) return signIn();

    if ("postTitle" in props) {
      const reportDetails = {
        reportedById: session?.user?.id,
        reportedByEmail: session?.user?.email,
        reportedByUser: session?.user?.name,
        reportedOnName: props.name,
        postTitle: props.postTitle,
        postId: props.postId,
        postUrl: props.postUrl,
        postUsername: props.postUsername,
        commentMadeByReporter: comment,
        timeReportSent: new Date(),
      };

      const htmlMessage = createArticleReportEmailTemplate(reportDetails);
      const mailInputs = {
        htmlMessage: htmlMessage,
        subject: "A user has reported an article on Codú.co",
      };
      sendEmail(mailInputs);
    } else {
      const reportDetails = {
        reportedById: session?.user?.id,
        reportedByEmail: session?.user?.email,
        reportedByUser: session?.user?.name,
        reportedOnName: props.name,
        reportedOnEmail: props.email,
        reportedComment: props.body,
        commentMadeByReporter: comment,
        commentId: props.id,
        timeReportSent: new Date(),
        postLink: `https://codu.co/articles/${props.slug}`,
      };

      const htmlMessage = createCommentReportEmailTemplate(reportDetails);
      const mailInputs = {
        htmlMessage: htmlMessage,
        subject: "A user has reported a comment on Codú.co",
      };
      sendEmail(mailInputs);
      setIsModalOpen(false);
      setComment("");
    }
  };
  const isComment = "body" in props;

  return (
    <>
      {isComment && (
        <button
          aria-label="flag comment"
          onClick={(e) => {
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
                  Is {!isComment ? "something in this article" : "this comment"}{" "}
                  inappropriate?
                </p>
                <p className="border p-4  bg-neutral-700 text-zinc-200 rounded">
                  <span>{!isComment ? "Article : " : "Comment : "}</span>
                  {isComment && props.body}
                  {!isComment && props.postTitle}
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
                  onChange={(e) => setComment(e.target.value)}
                  value={comment}
                  className="rounded"
                  ref={textAreaRef}
                />

                <div className="flex justify-end text-sm mt-8">
                  <button
                    className="primary-button"
                    type="submit"
                    onClick={handleSubmit}
                  >
                    SUBMIT REPORT
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
