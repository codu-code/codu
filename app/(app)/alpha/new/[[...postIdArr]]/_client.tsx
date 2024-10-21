"use client";
import { redirect, useParams } from "next/navigation";
import React, { useEffect, Fragment } from "react";
import { Controller } from "react-hook-form";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import Editor from "@/components/editor/editor";
import useCreatePage from "@/hooks/useCreatePage";
import { usePrompt } from "@/components/PromptService";

const Create = () => {
  const params = useParams();
  const postId = params?.postIdArr?.[0] || "";

  const {
    tags,
    tagValue,
    savedTime,
    open,
    setOpen,
    hasUnsavedChanges,
    handleSubmit,
    register,
    control,
    savePost,
    isDisabled,
    onSubmit,
    onChange,
    onDelete,
    onKeyDown,
    handleOpenDialog,
    data,
    hasLoadingState,
    dataStatus,
    title,
    body,
    saveStatus,
  } = useCreatePage({ postId });

  const { unsavedChanges: _unsaved, setUnsavedChanges: _setUnsaved } =
    usePrompt();

  useEffect(() => {
    _setUnsaved(hasUnsavedChanges);
  }, [hasUnsavedChanges, _setUnsaved]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Transition show={open} as={Fragment}>
          <div className="fixed bottom-0 left-0 top-0 z-50 h-screen w-full bg-black">
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
                    <p className="mt-2 text-sm text-neutral-400">
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
                    <p className="mt-2 text-sm text-neutral-400">
                      Tag with up to 5 topics. This makes it easier for readers
                      to find and know what your story is about.
                    </p>
                  </div>
                  <div className="col-span-12 border-b border-neutral-300 pb-4">
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <DisclosureButton className="flex w-full justify-between py-2 text-left text-sm font-medium text-white focus:outline-none focus-visible:ring focus-visible:ring-pink-300 focus-visible:ring-opacity-75">
                            <span>View advanced settings</span>
                            <ChevronUpIcon
                              className={`${
                                open ? "rotate-180 transform" : ""
                              } h-5 w-5 text-neutral-400`}
                            />
                          </DisclosureButton>
                          <DisclosurePanel className="pb-2 pt-4">
                            <label htmlFor="canonicalUrl">Canonical URL</label>
                            <input
                              id="canonicalUrl"
                              type="text"
                              placeholder="https://www.somesite.com/i-posted-here-first"
                              defaultValue=""
                              {...register("canonicalUrl")}
                            />
                            <p className="mt-2 text-sm text-neutral-400">
                              Add this if the post was originally published
                              elsewhere and you want to link to it as the
                              original source.
                            </p>
                          </DisclosurePanel>
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
                          redirect("/my-posts?tab=drafts");
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
        </Transition>
        {dataStatus === "loading" && postId && (
          <div className="bg-gray fixed left-0 top-0 z-40 flex h-screen w-screen items-center justify-center">
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
        <div className="mx-auto break-words px-2 pb-4 sm:px-4 md:max-w-3xl">
          <div className="prose mx-auto max-w-3xl dark:prose-invert lg:prose-lg">
            {!body && (
              <Controller
                name="body"
                control={control}
                render={({ field }) => (
                  <Editor {...field} initialValue={"{}"} />
                )}
              />
            )}
            {body && body.length > 0 && (
              <Controller
                name="body"
                control={control}
                render={({ field }) => (
                  <Editor {...field} initialValue={body} />
                )}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                {saveStatus === "loading" && (<p className="text-xs lg:text-sm">Auto-saving...</p>)}
                {saveStatus === "error" && savedTime && (
                  <p className="text-xs text-red-600 lg:text-sm">
                    Error saving, last saved: {savedTime.toString()}
                  </p>
                )}
                {saveStatus === "success" && savedTime && (
                  <p className="text-xs text-neutral-400 lg:text-sm">
                    Saved: {savedTime.toString()}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isDisabled}
                className="ml-5 inline-flex justify-center bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 disabled:opacity-50"
                onClick={() => setOpen(true)}
                aria-label={data?.published ? "Save changes to document" : "Publish document"}
              >
                {data?.published ? "Save Changes" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default Create;
