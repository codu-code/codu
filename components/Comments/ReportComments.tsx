import React, { useRef, useState } from "react";
import Flag from "../../icons/flag.svg";
import { XIcon } from "@heroicons/react/outline";
import toast from "react-hot-toast";
import { signIn, useSession } from "next-auth/react";
import { createCommentReportEmailTemplate } from "../../utils/createCommentReportEmailTemplate";
import { api } from "@/server/trpc/react";
import { createArticleReportEmailTemplate } from "@/utils/createArticleReportEmailTemplate";
import { Dialog } from "@headlessui/react";

interface Props {
  postTitle?: string;
  postId?: string;
  postUrl?: string;
  postUsername?: string;
  name: string;
  body?: string;
  id?: number;
  email?: string | null;
  slug?: string;
}

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
  const {
    name,
    body,
    id,
    email,
    slug,
    postTitle,
    postId,
    postUrl,
    postUsername,
  } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // const [isModalOpen, setIsModalOpen] = useState<boolean>(isModalOpenProp||false);
  const [comment, setComment] = useState("");
  let textAreaRef = useRef(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) return signIn();

    if (!postTitle) {
      // report on a comment
      const reportDetails = {
        reportedById: session?.user?.id,
        reportedByEmail: session?.user?.email,
        reportedByUser: session?.user?.name,
        reportedOnName: name,
        reportedOnEmail: email,
        reportedComment: body,
        commentMadeByReporter: comment,
        commentId: id,
        timeReportSent: new Date(),
        postLink: `https://codu.co/articles/${slug}`,
      };

      const htmlMessage = createCommentReportEmailTemplate(reportDetails);

      const mailInputs = {
        htmlMessage: htmlMessage,
        subject: "A user has reported a comment on Codú.co",
      };

      sendEmail(mailInputs);
    } else {
      // report on an article
      const reportDetails = {
        reportedById: session?.user?.id,
        reportedByEmail: session?.user?.email,
        reportedByUser: session?.user?.name,
        reportedOnName: name,
        postTitle,
        postId,
        postUrl,
        postUsername,
        commentMadeByReporter: comment,
        timeReportSent: new Date(),
      };

      const htmlMessage = createArticleReportEmailTemplate(reportDetails);

      const mailInputs = {
        htmlMessage: htmlMessage,
        subject: "A user has reported an article on Codú.co",
      };

      sendEmail(mailInputs);
    }
    setIsModalOpen(false);
    setComment("");
  };

  return (
    <>
      {body && (
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

      {!body && (
        <button
          onClick={() => (session ? setIsModalOpen(true) : signIn())}
          className="p-1 rounded w-full flex px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200"
        >
          Report Article
        </button>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialFocus={textAreaRef}
      >
        {/* <div className="fixed inset-0 bg-gray-700/90" aria-hidden="true" /> */}
        <div className="fixed inset-0 flex w-screen items-center justify-center">
          <Dialog.Panel className="p-0 border bg-neutral-900 text-neutral-400 max-w-lg rounded-lg relative ">
            <div className="m-8">
              <Dialog.Title className="text-2xl tracking-tight font-bold text-neutral-50 text-center">
                Submit a report
              </Dialog.Title>

              <Dialog.Description as="div">
                <p className="m-4 ml-0">
                  Is {postTitle ? "something in this article" : "this comment"}{" "}
                  inappropriate?
                </p>
                <p className="border p-4  bg-neutral-700 text-zinc-200 rounded">
                  <span>{postTitle ? "Article : " : "Comment : "}</span>
                  {body}
                  {postTitle}
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

//  {!postTitle && (
//       <button
//         aria-label="flag comment"
//         onClick={() => (session ? setIsModalOpen(true) : signIn())}
//         className="mr-4 flex p-1.5 rounded-full hover:bg-neutral-800"
//       >
//         <Flag className="h-5 " />
//       </button>
//     )}

//     {postTitle && (
//       <button
//         onClick={() => (session ? setIsModalOpen(true) : signIn())}
//         className="p-1 rounded w-full flex px-4 py-2 text-neutral-900 dark:text-neutral-700 hover:bg-neutral-200"
//       >
//         Report Article
//       </button>
//     )}