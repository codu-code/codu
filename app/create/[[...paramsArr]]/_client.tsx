"use client";
import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import React, { useState, useEffect, Fragment, useRef } from "react";
import { useForm } from "react-hook-form";
import CustomTextareaAutosize from "../../../components/CustomTextareAutosize/CustomTextareaAutosize";
import { toast } from "sonner";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import type { SavePostInput } from "../../../schema/post";
import { ConfirmPostSchema } from "../../../schema/post";
import { api } from "@/server/trpc/react";
import { removeMarkdown } from "../../../utils/removeMarkdown";
import { useDebounce } from "../../../hooks/useDebounce";
import Markdoc from "@markdoc/markdoc";
import { useMarkdownHotkeys } from "../../../markdoc/editor/hotkeys/hotkeys.markdoc";
import { useMarkdownShortcuts } from "../../../markdoc/editor/shortcuts/shortcuts.markdoc";
import { markdocComponents } from "../../../markdoc/components";
import { config } from "../../../markdoc/config";
import { useParams, useRouter } from "next/navigation";
import { usePrompt } from "@/components/PromptService";
import { Switch } from "@/components/Switch/Switch";
import { dateToLocalDatetimeStr } from "@/utils/datetime";

const Create = () => {
  const params = useParams();
  const router = useRouter();

  const postId = params?.paramsArr?.[0] || "";

  // @TODO - Redirect to create/:id if paramArr.length > 2

  const [viewPreview, setViewPreview] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState<string>("");
  const [savedTime, setSavedTime] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [isPostScheduled, setIsPostScheduled] = useState<boolean>(false);
  const [shouldRefetch, setShouldRefetch] = useState<boolean>(true);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

  const { unsavedChanges: _unsaved, setUnsavedChanges: _setUnsaved } =
    usePrompt();

  useEffect(() => {
    _setUnsaved();
  }, [unsavedChanges, _setUnsaved]);

  const allowUpdate = unsavedChanges;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useMarkdownHotkeys(textareaRef);
  useMarkdownShortcuts(textareaRef);

  const {
    handleSubmit,
    register,
    watch,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<SavePostInput>({
    mode: "onSubmit",
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const { title, body } = watch();

  const debouncedValue = useDebounce(title + body, 1500);

  const {
    mutate: publish,
    status: publishStatus,
    data: publishData,
  } = api.post.publish.useMutation({
    onError(error) {
      toast.error("Error saving settings.");
      Sentry.captureException(error);
    },
  });

  const { mutate: save, status: saveStatus } = api.post.update.useMutation({
    onError(error) {
      // TODO: Add error messages from field validations
      toast.error("Error auto-saving");
      Sentry.captureException(error);
    },
    onSuccess() {
      toast.success("Saved");
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
    },
  });
  const {
    mutate: create,
    data: createData,
    isError,
    isSuccess,
  } = api.post.create.useMutation();

  // TODO get rid of this for standard get post
  // Should be allowed get draft post through regular mechanism if you own it
  const {
    data,
    status: dataStatus,
    isError: draftFetchError,
  } = api.post.editDraft.useQuery(
    { id: postId },
    {
      enabled: !!postId && shouldRefetch,
    },
  );

  useEffect(() => {
    if (isError) {
      toast.error("Error saving");
    }

    if (isSuccess) {
      toast.success("Saved");
    }

    if (draftFetchError) {
      toast.error(
        "Something went wrong fetching your draft, refresh your page or you may lose data",
      );
    }
  }, [draftFetchError, isError, isSuccess]);

  useEffect(() => {
    if (shouldRefetch) {
      setShouldRefetch(!(dataStatus === "success"));
    }
  }, [dataStatus, shouldRefetch]);

  const getFormData = () => {
    const data = getValues();
    const formData = {
      ...data,
      tags,
      canonicalUrl: data.canonicalUrl || undefined,
      excerpt: data.excerpt || removeMarkdown(data.body, {}).substring(0, 155),
    };
    return formData;
  };

  const savePost = async () => {
    const formData = getFormData();
    // Don't include published time when saving post, handle separately in onSubmit
    delete formData.published;
    if (!formData.id) {
      create({ ...formData });
    } else {
      save({ ...formData, id: postId });
    }
    setUnsavedChanges(false);
  };

  const hasLoadingState =
    publishStatus === "loading" ||
    saveStatus === "loading" ||
    dataStatus === "loading";

  const published = data?.published ? data.published < new Date() : false;

  const onSubmit = async (data: SavePostInput) => {
    // validate markdoc syntax
    const ast = Markdoc.parse(data.body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical",
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
        const formData = getFormData();
        ConfirmPostSchema.parse(formData);
        publish({
          id: postId,
          published: !published,
          publishTime: formData.published
            ? new Date(formData.published)
            : undefined,
        });
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

  if (publishStatus === "success" && publishData?.slug) {
    router.push(`/articles/${publishData.slug}`);
  }

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
    const { body, excerpt, title, id, tags, published } = data;
    setTags(tags.map(({ tag }) => tag.title));
    reset({
      body,
      excerpt,
      title,
      id,
      published: dateToLocalDatetimeStr(published),
    });
    setIsPostScheduled(published ? published > new Date() : false);
  }, [data]);

  useEffect(() => {
    if (published) return;
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    if (allowUpdate) savePost();
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(`create/${createData.id}`);
  }, [createData]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  useEffect(() => {
    if ((title + body).length < 5) return;
    if (isDirty) setUnsavedChanges(true);
  }, [title, body]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Transition.Root show={open} as={Fragment}>
          <div className="fixed bottom-0 left-0 top-0 z-50 h-screen w-full bg-white dark:bg-black">
            <button
              type="button"
              className="absolute right-8 top-8 z-50 cursor-pointer underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            <div className="relative mx-4 flex h-full flex-col items-center justify-center overflow-y-auto">
              <div className="pb-8 pt-16">
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
                    <small className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      What readers will see before they click on your article.
                      Good SEO descriptions utilize keywords, summarize the
                      story and are between 140-156 characters long.
                    </small>
                  </div>
                  <div className="my-4 sm:col-span-6 sm:my-0">
                    <label htmlFor="tags">Topics</label>
                    <input
                      id="tags"
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
                        className="mr-1 mt-2 inline-flex items-center overflow-hidden bg-neutral-300 text-sm"
                      >
                        <span
                          className="ml-2 mr-1 max-w-xs truncate px-1 text-xs font-semibold leading-relaxed text-black"
                          x-text="tag"
                        >
                          {tag}
                        </span>
                        <button
                          onClick={() => onDelete(tag)}
                          className="inline-block h-6 w-6 bg-neutral-600 align-middle text-white focus:outline-none"
                        >
                          <svg
                            className="mx-auto h-6 w-6 fill-current"
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
                    <small className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                      Tag with up to 5 topics. This makes it easier for readers
                      to find and know what your story is about.
                    </small>
                  </div>

                  {data &&
                    (data.published === null ||
                      data.published > new Date()) && (
                      <div className="col-span-12">
                        <div className="mb-2 flex items-center gap-2">
                          <label
                            htmlFor="schedule-switch"
                            className="text-sm font-medium text-neutral-800 dark:text-white"
                          >
                            Schedule post
                          </label>
                          <Switch
                            id="schedule-switch"
                            checked={isPostScheduled}
                            onCheckedChange={setIsPostScheduled}
                          />
                        </div>
                        {isPostScheduled && (
                          <input
                            type="datetime-local"
                            {...register("published")}
                          />
                        )}
                        <small className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          Publish your post at a later time.
                        </small>
                      </div>
                    )}

                  <div className="col-span-12  border-b border-neutral-300 pb-4">
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between py-2 text-left text-sm font-medium text-neutral-800 focus:outline-none focus-visible:ring focus-visible:ring-pink-500 focus-visible:ring-opacity-75 dark:text-white">
                            <span>View advanced settings</span>
                            <ChevronUpIcon
                              className={`${
                                open ? "" : "rotate-180 transform"
                              } h-5 w-5 text-neutral-400`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="pb-2 pt-4">
                            <label htmlFor="canonicalUrl">Canonical URL</label>
                            <input
                              id="canonicalUrl"
                              type="text"
                              placeholder="https://www.somesite.com/i-posted-here-first"
                              defaultValue={
                                data?.canonicalUrl ? data.canonicalUrl : ""
                              }
                              {...register("canonicalUrl")}
                            />
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                              Add this if the post was originally published
                              elsewhere and you want to link to it as the
                              original source.
                            </p>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                  <div className="mt-4 flex w-full justify-end sm:col-span-12 sm:mt-0">
                    {!data?.published && (
                      <button
                        type="button"
                        disabled={isDisabled}
                        className="inline-flex justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
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
                      className="ml-5 inline-flex justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                    >
                      {hasLoadingState ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-orange-600 border-t-white" />
                          {"Saving"}
                        </>
                      ) : (
                        <>
                          {data?.published
                            ? "Save Changes"
                            : isPostScheduled
                              ? "Schedule"
                              : "Publish"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition.Root>
        {dataStatus === "loading" && postId && (
          <div className="bg-gray fixed left-0 top-0 z-40 flex h-screen w-screen items-center justify-center ">
            <div className="z-50 flex flex-col items-center border-2 border-black bg-white px-5 py-2 opacity-100">
              <div className="loader-dots relative mt-2 block h-5 w-20">
                <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
                <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm"></div>
              </div>
              <div className="mt-2 text-center text-xs font-medium text-neutral-400">
                Fetching post data.
              </div>
            </div>
            <div className="z-60 absolute bottom-0 left-0 right-0 top-0 bg-black opacity-25" />
          </div>
        )}
        <>
          <div className="mx-auto w-full max-w-7xl flex-grow lg:flex xl:px-8">
            {/* Left sidebar & main wrapper */}
            <div className="min-w-0 flex-1 xl:flex">
              <div className="xl:w-64 xl:flex-shrink-0 ">
                <div className="h-full py-6 pl-4 pr-6 sm:pl-6 lg:px-4  xl:pl-0">
                  {/* Start left column area */}
                  <div className="relative h-full">
                    <div className="bg-white p-6 text-neutral-600 shadow dark:bg-neutral-900">
                      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-white">
                        {viewPreview ? "Previewing" : "Editing"} post
                      </h1>
                      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                        The body of your content can be edited using markdown.
                        Your post remains private until you
                        &#8220;publish&#8221; the article.
                      </p>
                      <div className="flex">
                        <button
                          type="button"
                          className="mt-4 inline-flex justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
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
                <div className="h-full px-4 py-0 sm:px-6 lg:px-4 lg:py-6 ">
                  {/* Start main area*/}
                  <div className="relative h-full">
                    <div className="bg-white text-white shadow dark:bg-neutral-900">
                      {viewPreview ? (
                        <section className="mx-auto max-w-xl px-4 py-6 pb-4 sm:p-6 lg:pb-8">
                          <article
                            className="prose"
                            style={{
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <h1>{title}</h1>
                            {Markdoc.renderers.react(
                              Markdoc.transform(Markdoc.parse(body), config),
                              React,
                              {
                                components: markdocComponents,
                              },
                            )}
                          </article>
                        </section>
                      ) : (
                        <div className="px-4 py-6 sm:p-6 lg:pb-8">
                          {/* TODO: FOLLOW UP WITH THIS, LABEL SHOULD BE VISIBLE */}
                          <label htmlFor="article-title" className="sr-only">
                            Article title
                          </label>
                          <input
                            className="border-none bg-white text-2xl leading-5 outline-none focus:bg-neutral-200 dark:bg-neutral-900 focus:dark:bg-black"
                            placeholder="Article title"
                            type="text"
                            id="article-title"
                            {...register("title")}
                          />

                          {/* TODO: FOLLOW UP WITH THIS, LABEL SHOULD BE VISIBLE */}
                          <label htmlFor="article-content" className="sr-only">
                            Enter Article Content
                          </label>
                          <CustomTextareaAutosize
                            placeholder="Enter your content here 💖"
                            className="mb-8 border-none bg-white text-lg shadow-none outline-none focus:bg-neutral-200 dark:bg-neutral-900 dark:focus:bg-black"
                            minRows={25}
                            id="article-content"
                            {...register("body")}
                            inputRef={textareaRef}
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
                                <p className="text-xs text-neutral-400 lg:text-sm">
                                  {`Saved: ${savedTime.toString()}`}
                                </p>
                              )}
                            </>
                            <div />

                            <div className="flex">
                              <button
                                type="button"
                                disabled={isDisabled}
                                className="ml-5 inline-flex justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 disabled:opacity-50"
                                onClick={() => setOpen(true)}
                              >
                                Next
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
            <div className="pr-4 sm:pr-6 lg:flex-shrink-0 lg:pr-8 xl:pr-0">
              <div className="h-full py-6 pl-4 sm:pl-6 lg:w-80 xl:pl-4">
                {/* Start right column area */}
                <div className="bg-white p-6 text-neutral-600 shadow dark:bg-neutral-900">
                  <h3 className="text-xl font-semibold tracking-tight text-neutral-800 dark:text-white">
                    How to use the editor
                  </h3>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-400">
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
        </>
      </form>
    </>
  );
};

export default Create;
