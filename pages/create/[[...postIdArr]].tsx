import { NextPage, GetServerSideProps } from "next";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useForm } from "react-hook-form";
import Router from "next/router";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import rehypePrism from "rehype-prism";
import TextareaAutosize from "react-textarea-autosize";
import toast, { Toaster } from "react-hot-toast";

import { SavePostInput } from "../../schema/post";
import Layout from "../../components/Layout/Layout";
import { trpc } from "../../utils/trpc";
import { useDebounce } from "../../hooks/useDebounce";

const Create: NextPage = () => {
  const router = useRouter();
  const { postIdArr } = router.query;

  const postId = postIdArr?.[0] || "";

  const [viewPreview, setViewPreview] = useState<boolean>(false);
  const [savedTime, setSavedTime] = useState<string>();

  const { handleSubmit, register, watch, reset } = useForm<SavePostInput>({
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const { title, body } = watch();

  const debouncedValue = useDebounce(title + body, 1500);

  const { mutate: publish, status: publishStatus } = trpc.useMutation([
    "post.publish-post",
  ]);

  const { mutate: save, status: saveStatus } = trpc.useMutation(
    ["post.save-post"],
    {
      onError() {
        toast.error("Something went wrong auto-saving");
      },
      onSuccess() {
        toast.success("Saved");
        setSavedTime(
          new Date().toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })
        );
      },
    }
  );
  const { mutate: create, data: createData } = trpc.useMutation(
    ["post.create-post"],
    {
      onError() {
        toast.error("Something went wrong creating draft");
      },
      onSuccess() {
        toast.success("Saved draft");
      },
    }
  );

  const { data, status: dataStatus } = trpc.useQuery(
    ["post.single-draft", { id: postId }],
    {
      onError() {
        toast.error(
          "Something went wrong fetching your draft, refresh your page or you may lose data",
          {
            duration: 5000,
          }
        );
      },
      enabled: !!postId,
    }
  );

  const savePost = async (values: { title: string; body: string }) => {
    if (!postId) {
      create({ ...values });
    } else {
      save({ ...values, id: postId });
    }
  };

  const published = data?.published || false;

  const onSubmit = () => {
    publish({ id: postId, published: !published });
  };

  useEffect(() => {
    if (!data) return;
    reset(data);
  }, [data]);

  useEffect(() => {
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    savePost({ title, body });
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(createData.id);
  }, [createData]);

  return (
    <Layout>
      <>
        <Toaster
          toastOptions={{
            style: {
              borderRadius: 0,
              border: "2px solid black",
              background: "white",
            },
          }}
        />
        {dataStatus === "loading" && postId && (
          <div className="fixed top-0 left-0 z-40 w-screen h-screen flex items-center justify-center bg-gray ">
            <div className="bg-white z-50 py-2 px-5 flex items-center flex-col border-2 border-black opacity-100">
              <div className="loader-dots block relative w-20 h-5 mt-2">
                <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
              </div>
              <div className="text-gray-500 text-xs font-medium mt-2 text-center">
                Fetching post data.
              </div>
            </div>
            <div className="absolute bg-black top-0 bottom-0 left-0 right-0 opacity-25 z-60" />
          </div>
        )}
        <div className="bg-gray-100">
          <div className="flex-grow w-full max-w-7xl mx-auto xl:px-8 lg:flex text-black">
            {/* Left sidebar & main wrapper */}
            <div className="flex-1 min-w-0 xl:flex">
              <div className="xl:flex-shrink-0 xl:w-64 ">
                <div className="h-full pl-4 pr-6 py-6 sm:pl-6 xl:pl-0  lg:px-4">
                  {/* Start left column area */}
                  <div className="h-full relative">
                    <div className="bg-white text-gray-800 border-2 border-black shadow-xl p-6">
                      <h1 className="text-3xl tracking-tight font-extrabold text-black">
                        {viewPreview ? "Previewing" : "Editing"} your post
                      </h1>
                      <p className="mt-1 text-gray-600">
                        The body of your content can be edited using markdown.
                        Your post remains private until you
                        &#8220;publish&#8221; the article.
                      </p>
                      <div className="flex">
                        <button
                          type="button"
                          className="bg-white border border-gray-300 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300 mt-4"
                          onClick={() => setViewPreview((current) => !current)}
                        >
                          {viewPreview ? "Back to editing" : "View preview"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* End left column area */}
                </div>
              </div>

              <div className="lg:min-w-0 lg:flex-1">
                <div className="h-full py-0 lg:py-6 px-4 sm:px-6 lg:px-4 ">
                  {/* Start main area*/}
                  <div className="relative h-full">
                    <div className="bg-white text-gray-800 border-2 border-black shadow-xl">
                      {viewPreview ? (
                        <section className="mx-auto pb-4 max-w-xl py-6 px-4 sm:p-6 lg:pb-8">
                          <h2 className="pt-4 sm:my-5 text-3xl font-bold leading-tight">
                            {title}
                          </h2>
                          <article
                            className="prose whitespace-pre-wrap"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            <ReactMarkdown rehypePlugins={[rehypePrism]}>
                              {body}
                            </ReactMarkdown>
                          </article>
                        </section>
                      ) : (
                        <form onSubmit={handleSubmit(onSubmit)}>
                          <div className="py-6 px-4 sm:p-6 lg:pb-8">
                            <input
                              autoFocus
                              className="border-none text-2xl leading-5 outline-none"
                              placeholder="Your great title..."
                              type="text"
                              aria-label="Post Content"
                              {...register("title")}
                              defaultValue=""
                            />

                            <TextareaAutosize
                              placeholder="Enter your content here 💖"
                              className="border-none text-lg outline-none shadow-none mb-8"
                              minRows={25}
                              {...register("body")}
                              defaultValue=""
                            />
                            <div className="flex justify-between items-center">
                              <>
                                {saveStatus === "loading" && (
                                  <p>Auto-saving...</p>
                                )}
                                {saveStatus === "error" && savedTime && (
                                  <p className="text-red-600 text-xs lg:text-sm">
                                    {`Error saving, last saved: ${savedTime.toString()}`}
                                  </p>
                                )}
                                {saveStatus === "success" && savedTime && (
                                  <p className="text-gray-600 text-xs lg:text-sm">
                                    {`Auto-saved: ${savedTime.toString()}`}
                                  </p>
                                )}
                              </>
                              <div />

                              <div className="flex">
                                <button
                                  type="button"
                                  onClick={() => Router.push("/")}
                                  className="bg-white border border-gray-300 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="ml-5 w-20 bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                >
                                  {published ? "Unpublish" : "Publish"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                  {/* End main area */}
                </div>
              </div>
            </div>

            <div className="pr-4 sm:pr-6 lg:pr-8 lg:flex-shrink-0 xl:pr-0">
              <div className="h-full sm:pl-6 xl:pl-4 py-6 lg:w-80 pl-4">
                {/* Start right column area */}

                <div className="bg-white text-gray-800 border-2 border-black shadow-xl p-6">
                  <h3 className="text-xl tracking-tight font-semibold text-black">
                    How to use the editor
                  </h3>
                  <p className="mt-1 text-gray-600">
                    You can edit and format the main content of your article
                    using Markdown. If you have never used Markdown, you can
                    check out{" "}
                    <a
                      href="https://www.markdownguide.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fancy-link"
                    >
                      this
                    </a>{" "}
                    free guide on{" "}
                    <a
                      href="https://www.markdownguide.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fancy-link"
                    >
                      markdownguide
                    </a>
                    .
                  </p>
                </div>

                {/* End right column area */}
              </div>
            </div>
          </div>
        </div>
      </>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default Create;
