import { NextPage, GetServerSideProps } from "next";
import { ZodError } from "zod";
import { useRouter } from "next/router";
import React, { useState, useEffect, Fragment } from "react";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useForm } from "react-hook-form";
import TextareaAutosize from "react-textarea-autosize";
import toast, { Toaster } from "react-hot-toast";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";

import { SavePostInput, ConfirmPostSchema } from "../../schema/post";
import Layout from "../../components/Layout/Layout";

import { trpc } from "../../utils/trpc";
import { useDebounce } from "../../hooks/useDebounce";
import Markdoc from "@markdoc/markdoc";
import { markdocComponents } from "../../markdoc/components";
import { config } from "../../markdoc/config";
import { maybeGenerateExerpt } from "../../utils/maybeGenerateExerpt";

const Create: NextPage = () => {
  const router = useRouter();
  const { postIdArr } = router.query;

  const postId = postIdArr?.[0] || "";

  const [viewPreview, setViewPreview] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState<string>("");
  const [savedTime, setSavedTime] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  const {
    handleSubmit,
    register,
    watch,
    reset,
    getValues,
    formState: { errors, isValid },
  } = useForm<SavePostInput>({
    mode: "onSubmit",
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
    ["post.edit-draft", { id: postId }],
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

  const savePost = async () => {
    const data = getValues();
    const formData = { ...data, tags };

    if (!formData.id) {
      create({ ...formData });
    } else {
      save({ ...formData, id: postId });
    }
  };

  const hasLoadingState =
    publishStatus === "loading" ||
    saveStatus === "loading" ||
    dataStatus === "loading";

  const published = !!data?.published || false;

  const onSubmit = async (data: SavePostInput) => {
    // vaidate markdoc syntax
    const ast = Markdoc.parse(data.body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical"
    );

    if (errors.length > 0) {
      console.error(errors);
      errors.forEach((err) => {
        toast.error(err.error.message);
      });
      return;
    }
    if (!published) {
      try {
        const data = getValues();
        const { excerpt } = maybeGenerateExerpt(data);
        const formData = { ...data, tags };
        ConfirmPostSchema.parse(formData);
        await savePost();
        return await publish(
          { id: postId, published: !published, excerpt },
          {
            onSuccess(response) {
              response?.slug && router.push(`/articles/${response.slug}`);
            },
            onError() {
              toast.error("Something went wrong publishing, please try again.");
            },
          }
        );
      } catch (err) {
        if (err instanceof ZodError) {
          return toast.error(err.issues[0].message);
        } else {
          return toast.error("Something went when trying to publish.");
        }
      }
    }
    await savePost();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { value } = e.target;
    setTagValue(value);
  };

  const onDelete = (tag: string) => {
    setTags((t) => t.filter((t) => t !== tag));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    const trimmedInput = tagValue
      .trim()
      .toUpperCase()
      .replace(/[^\w\s]/gi, "");
    if (
      (key === "," || key === "." || key === "Enter") &&
      trimmedInput.length &&
      !tags.includes(trimmedInput)
    ) {
      e.preventDefault();
      setTags((prevState) => [...prevState, trimmedInput]);
      setTagValue("");
    }
  };

  useEffect(() => {
    if (!data) return;
    const { body, excerpt, title, id, tags } = data;
    setTags(tags.map(({ tag }) => tag.title));
    reset({ body, excerpt, title, id });
  }, [data]);

  useEffect(() => {
    if (published) return;
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    savePost();
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(createData.id);
  }, [createData]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  return (
    <Layout>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Transition.Root show={open} as={Fragment}>
          <div className="fixed top-0 bottom-0 left-0 z-50 w-full h-screen text-black bg-white">
            <button
              type="button"
              className="absolute z-50 underline cursor-pointer right-8 top-8"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <div className="relative flex flex-col items-center justify-center h-full mx-4 overflow-y-scroll">
              <div className="pt-16 pb-8">
                <div className="block w-full max-w-2xl gap-6 sm:grid sm:grid-cols-12">
                  <div className="mt-8 sm:col-span-6 sm:mt-0">
                    {" "}
                    <label htmlFor="excerpt">Excerpt</label>
                    <textarea
                      maxLength={156}
                      id="excerpt"
                      rows={3}
                      {...register("excerpt")}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      What readers will see before they click on your article.
                      Good SEO descriptions utilize keywords, summarize the
                      story and are between 140-156 characters long.
                    </p>
                  </div>
                  <div className="my-4 sm:col-span-6 sm:my-0">
                    <label htmlFor="tags">Topics</label>
                    <input
                      id="tag"
                      name="tag"
                      disabled={tags.length >= 5}
                      placeholder={
                        tags.length >= 5
                          ? "Maximum 5 tags"
                          : "Comma seperated tags"
                      }
                      type="text"
                      onChange={(e) => onChange(e)}
                      value={tagValue}
                      onKeyDown={onKeyDown}
                    />
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center mt-2 mr-1 overflow-hidden text-sm bg-gray-300"
                      >
                        <span
                          className="max-w-xs px-1 ml-2 mr-1 text-xs leading-relaxed truncate"
                          x-text="tag"
                        >
                          {tag}
                        </span>
                        <button
                          onClick={() => onDelete(tag)}
                          className="inline-block w-6 h-6 text-white align-middle bg-gray-600 focus:outline-none"
                        >
                          <svg
                            className="w-6 h-6 mx-auto fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M15.78 14.36a1 1 0 0 1-1.42 1.42l-2.82-2.83-2.83 2.83a1 1 0 1 1-1.42-1.42l2.83-2.82L7.3 8.7a1 1 0 0 1 1.42-1.42l2.83 2.83 2.82-2.83a1 1 0 0 1 1.42 1.42l-2.83 2.83 2.83 2.82z"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <p className="mt-2 text-sm text-gray-500">
                      Tag with up to 5 topics. This makes it easier for readers
                      to find and know what your story is about.
                    </p>
                  </div>
                  <div className="col-span-12 pb-4 border-b border-gray-300">
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex justify-between w-full py-2 text-sm font-medium text-left text-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                            <span>View advanced settings</span>
                            <ChevronUpIcon
                              className={`${open ? "rotate-180 transform" : ""
                                } h-5 w-5 text-gray-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="pt-4 pb-2">
                            <label htmlFor="canonicalUrl">Canonical URL</label>
                            <input
                              id="canonicalUrl"
                              type="text"
                              placeholder="https://www.somesite.com/i-posted-here-first"
                              defaultValue=""
                              {...register("canonicalUrl")}
                            />
                            <p className="mt-2 text-sm text-gray-500">
                              Add this if the post was originally published
                              elsewhere and you want to link to it as the
                              original source.
                            </p>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                  <div className="flex justify-end w-full mt-4 sm:mt-0 sm:col-span-12">
                    {!data?.published && (
                      <button
                        type="button"
                        disabled={isDisabled}
                        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                        onClick={async () => {
                          if (isDisabled) return;
                          await savePost();
                          router.push("/my-posts?tab=drafts");
                        }}
                      >
                        Save Draft
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isDisabled}
                      className="inline-flex justify-center px-4 py-2 ml-5 text-sm font-medium text-white shadow-sm bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                    >
                      {hasLoadingState ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-orange-700 rounded-full animate-spin border-t-white" />
                          {"Saving"}
                        </>
                      ) : (
                        <>
                          {!data?.published && "Publish"}
                          {data?.published && "Save Changes"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition.Root>
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
          <div className="fixed top-0 left-0 z-40 flex items-center justify-center w-screen h-screen bg-gray ">
            <div className="z-50 flex flex-col items-center px-5 py-2 bg-white border-2 border-black opacity-100">
              <div className="relative block w-20 h-5 mt-2 loader-dots">
                <div className="absolute top-0 w-3 h-3 mt-1 rounded-full shadow-sm bg-gradient-to-r from-orange-400 to-pink-600"></div>
                <div className="absolute top-0 w-3 h-3 mt-1 rounded-full shadow-sm bg-gradient-to-r from-orange-400 to-pink-600"></div>
                <div className="absolute top-0 w-3 h-3 mt-1 rounded-full shadow-sm bg-gradient-to-r from-orange-400 to-pink-600"></div>
                <div className="absolute top-0 w-3 h-3 mt-1 rounded-full shadow-sm bg-gradient-to-r from-orange-400 to-pink-600"></div>
              </div>
              <div className="mt-2 text-xs font-medium text-center text-gray-500">
                Fetching post data.
              </div>
            </div>
            <div className="absolute top-0 bottom-0 left-0 right-0 bg-black opacity-25 z-60" />
          </div>
        )}
        <div className="bg-gray-100">
          <div className="flex-grow w-full mx-auto text-black max-w-7xl xl:px-8 lg:flex">
            {/* Left sidebar & main wrapper */}
            <div className="flex-1 min-w-0 xl:flex">
              <div className="xl:flex-shrink-0 xl:w-64 ">
                <div className="h-full py-6 pl-4 pr-6 sm:pl-6 xl:pl-0 lg:px-4">
                  {/* Start left column area */}
                  <div className="relative h-full">
                    <div className="p-6 text-gray-800 bg-white border-2 border-black shadow-xl">
                      <h1 className="text-3xl font-extrabold tracking-tight text-black">
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
                          className="inline-flex justify-center px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
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
                <div className="h-full px-4 py-0 lg:py-6 sm:px-6 lg:px-4 ">
                  {/* Start main area*/}
                  <div className="relative h-full">
                    <div className="text-gray-800 bg-white border-2 border-black shadow-xl">
                      {viewPreview ? (
                        <section className="max-w-xl px-4 py-6 pb-4 mx-auto sm:p-6 lg:pb-8">
                          <h2 className="pt-4 text-3xl font-bold leading-tight sm:my-5">
                            {title}
                          </h2>
                          <article
                            className="prose whitespace-pre-wrap"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {Markdoc.renderers.react(
                              Markdoc.transform(Markdoc.parse(body), config),
                              React,
                              {
                                components: markdocComponents,
                              }
                            )}
                          </article>
                        </section>
                      ) : (
                        <div className="px-4 py-6 sm:p-6 lg:pb-8">
                          <input
                            autoFocus
                            className="text-2xl leading-5 border-none outline-none"
                            placeholder="Your great title..."
                            type="text"
                            aria-label="Post Content"
                            {...register("title")}
                          />

                          <TextareaAutosize
                            placeholder="Enter your content here 💖"
                            className="mb-8 text-lg border-none shadow-none outline-none"
                            minRows={25}
                            {...register("body")}
                          />
                          <div className="flex items-center justify-between">
                            <>
                              {saveStatus === "loading" && (
                                <p>Auto-saving...</p>
                              )}
                              {saveStatus === "error" && savedTime && (
                                <p className="text-xs text-red-600 lg:text-sm">
                                  {`Error saving, last saved: ${savedTime.toString()}`}
                                </p>
                              )}
                              {saveStatus === "success" && savedTime && (
                                <p className="text-xs text-gray-600 lg:text-sm">
                                  {`Saved: ${savedTime.toString()}`}
                                </p>
                              )}
                            </>
                            <div />

                            <div className="flex">
                              <button
                                type="button"
                                disabled={isDisabled}
                                className="inline-flex justify-center px-4 py-2 ml-5 text-sm font-medium text-white shadow-sm disabled:opacity-50 bg-gradient-to-r from-orange-400 to-pink-600 hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                onClick={() => setOpen(true)}
                              >
                                {!data?.published && "Publish"}
                                {data?.published && "Save Changes"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* End main area */}
                </div>
              </div>
            </div>
            <div className="pr-4 sm:pr-6 lg:pr-8 lg:flex-shrink-0 xl:pr-0">
              <div className="h-full py-6 pl-4 sm:pl-6 xl:pl-4 lg:w-80">
                {/* Start right column area */}
                <div className="p-6 text-gray-800 bg-white border-2 border-black shadow-xl">
                  <h3 className="text-xl font-semibold tracking-tight text-black">
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
      </form>
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
