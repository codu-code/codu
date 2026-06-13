"use client";

import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import React, {
  useState,
  useEffect,
  Fragment,
  useCallback,
  Suspense,
  useRef,
  useMemo,
} from "react";
import { toast } from "sonner";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ConfirmContentSchema } from "@/schema/content";
import { api } from "@/server/trpc/react";
import { removeMarkdown } from "@/utils/removeMarkdown";
import { useDebounce } from "@/hooks/useDebounce";
import Markdoc from "@markdoc/markdoc";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { notFound, useParams, useRouter } from "next/navigation";
import { usePrompt } from "@/components/PromptService";
import copy from "copy-to-clipboard";
import { type PostStatus, getPostStatus, status } from "@/utils/post";
import { Eye, EyeOff, Settings2, Share2 } from "lucide-react";
import EditorNav from "./navigation";
import { type Session } from "next-auth";

import { WriteTab } from "@/components/PostEditor/tabs/WriteTab";
import { TagInput } from "@/components/PostEditor/components/TagInput";

// Playful, on-brand lines that rotate under the "Reviewing your post…" loader
// while the publish mutation runs (auto-review can take a few seconds).
const REVIEW_LINES = [
  "Checking the vibes…",
  "Making sure it's a fit for the community…",
  "Reading it over…",
  "Almost there…",
];

const CreateContent = ({ session }: { session: Session | null }) => {
  const params = useParams();
  const router = useRouter();

  const postId = params?.paramsArr?.[0] || "";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  const [viewPreview, setViewPreview] = useState(false);
  const [savedTime, setSavedTime] = useState("");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const formPopulatedRef = useRef(false);
  const [copied, setCopied] = useState(false);
  const [postStatus, setPostStatus] = useState<PostStatus | null>(null);

  const { setUnsavedChanges: _setUnsaved } = usePrompt();

  useEffect(() => {
    _setUnsaved(unsavedChanges);
  }, [unsavedChanges, _setUnsaved]);

  const debouncedValue = useDebounce(title + body, 1500);

  const { mutate: publish, status: publishStatus } =
    api.content.publish.useMutation({
      onError(error) {
        // A CONFLICT is the dedupe gate refusing a duplicate link/question. It's
        // expected user behaviour, not an exception: surface the human-readable
        // message (e.g. "This link was already shared on Codú recently…") once
        // and do NOT send it to Sentry. Other errors keep the generic toast +
        // Sentry. The call-level onError below rejects the promise so onSubmit
        // stops; the catch block must not toast again for these (see onSubmit).
        if (error?.data?.code === "CONFLICT") {
          toast.error(error.message);
        } else {
          toast.error("Error saving settings.");
          Sentry.captureException(error);
        }
      },
    });

  const { mutate: save, status: saveStatus } = api.content.update.useMutation({
    onError(error) {
      toast.error("Error auto-saving");
      Sentry.captureException(error);
    },
  });

  const {
    mutateAsync: create,
    data: createData,
    isError,
  } = api.content.create.useMutation();

  const {
    data,
    status: dataStatus,
    isError: draftFetchError,
  } = api.content.editDraft.useQuery(
    { id: postId },
    {
      enabled: !!postId && !dataLoaded,
      staleTime: Infinity, // Prevent refetching
    },
  );

  const PREVIEW_URL = `${process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://www.codu.co"}/draft/${createData?.id || postId}`;

  const handleCopyToClipboard = () => {
    copy(PREVIEW_URL);
    setCopied(true);
  };

  useEffect(() => {
    if (isError) {
      toast.error("Error saving");
    }
    if (draftFetchError) {
      notFound();
    }
  }, [draftFetchError, isError]);

  useEffect(() => {
    if (dataStatus === "success" && !dataLoaded) {
      queueMicrotask(() => setDataLoaded(true));
    }
  }, [dataStatus, dataLoaded]);

  useEffect(() => {
    const to = setTimeout(setCopied, 2000, false);
    return () => clearTimeout(to);
  }, [copied]);

  const getFormData = useCallback(() => {
    const currentExcerpt =
      excerpt || removeMarkdown(body, {}).substring(0, 155);
    return {
      title,
      body,
      tags,
      excerpt: currentExcerpt,
      canonicalUrl: canonicalUrl || undefined,
    };
  }, [title, body, tags, excerpt, canonicalUrl]);

  const savePost = useCallback(async (): Promise<string> => {
    const formData = getFormData();

    if (!postId) {
      const result = await create({
        type: "POST",
        title: formData.title,
        body: formData.body,
        excerpt: formData.excerpt,
        canonicalUrl: formData.canonicalUrl,
        tags: formData.tags,
        published: false,
      });
      setUnsavedChanges(false);
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
      return result.id;
    } else {
      await save({
        id: postId,
        title: formData.title,
        body: formData.body,
        excerpt: formData.excerpt,
        canonicalUrl: formData.canonicalUrl,
        tags: formData.tags,
      });
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
      setUnsavedChanges(false);
      return postId;
    }
  }, [getFormData, postId, create, save]);

  const hasLoadingState =
    publishStatus === "pending" ||
    saveStatus === "pending" ||
    (!!postId && dataStatus === "pending");

  const isPublishing = publishStatus === "pending";

  // Rotate the playful loader lines while the publish/auto-review runs. The
  // interval only ticks while publishing; clearing it on unmount / when
  // publishing finishes. The displayed line is derived from the tick count so
  // we never reset state synchronously in the effect.
  const [reviewTick, setReviewTick] = useState(0);
  useEffect(() => {
    if (!isPublishing) return;
    const interval = setInterval(() => {
      setReviewTick((t) => t + 1);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPublishing]);
  const reviewLine = REVIEW_LINES[reviewTick % REVIEW_LINES.length];

  const currentPostStatus = data?.publishedAt
    ? getPostStatus(new Date(data.publishedAt))
    : status.DRAFT;

  const onSubmit = async () => {
    // Validate markdoc syntax before saving
    const ast = Markdoc.parse(body);
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

    try {
      const savedPostId = await savePost();

      // If already published, just redirect
      if (currentPostStatus === status.PUBLISHED) {
        setUnsavedChanges(false);
        setShowPublishConfirm(false);
        if (data && session?.user?.username) {
          router.push(`/${session.user.username}/${data.slug}`);
        }
        return;
      }

      const formData = getFormData();

      ConfirmContentSchema.parse(formData);

      // Use the saved post ID (not the one from URL params which might be stale)
      const publishResult = await new Promise<{
        slug: string;
        status?: string;
      }>((resolve, reject) => {
        publish(
          {
            id: savedPostId,
            published: true,
            publishTime: new Date(),
          },
          {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error),
          },
        );
      });

      setUnsavedChanges(false);
      setShowPublishConfirm(false);

      // Auto-moderation: when the gate is on, the server returns the post with
      // status `in_review` instead of publishing it. Surface that instead of
      // the normal "Published!" redirect.
      if (publishResult?.status === "in_review") {
        toast.success("Sent for review — we'll notify you when it's approved");
        router.push("/my-posts?tab=drafts");
      } else if (session?.user?.username && publishResult?.slug) {
        toast.success("Published!");
        router.push(`/${session.user.username}/${publishResult.slug}`);
      }
    } catch (err) {
      // ZodError is thrown synchronously by ConfirmContentSchema.parse above
      // (before the publish mutation runs), so no hook-level handler has fired —
      // toast it here.
      if (err instanceof ZodError) {
        return toast.error(err.issues[0].message);
      }
      // Any other error here is a rejected save/publish mutation. Those
      // mutations already showed the correct toast in their hook-level onError
      // (including the dedupe CONFLICT message), so we must NOT toast a second,
      // generic message — just log for debugging.
      console.error("Publish error:", err);
    }
  };

  // Populate once when data first arrives; batched to avoid cascading renders.
  const populateFormFromData = useCallback(() => {
    if (!data || formPopulatedRef.current) return;
    formPopulatedRef.current = true;

    const {
      body: existingBody,
      excerpt: existingExcerpt,
      title: existingTitle,
      tags: existingTags,
      publishedAt,
      canonicalUrl: existingCanonical,
    } = data;

    // The editor is article-only now (links are created from the compose
    // modal). Load whatever title/body exists into the article fields.
    setTitle(existingTitle || "");
    setBody(existingBody || "");
    setCanonicalUrl(existingCanonical || "");

    setExcerpt(existingExcerpt || "");
    setTags(existingTags.map(({ tag }) => tag.title.toUpperCase()));
    setPostStatus(
      publishedAt ? getPostStatus(new Date(publishedAt)) : status.DRAFT,
    );
  }, [data]);

  // Defer to avoid synchronous setState during render.
  useEffect(() => {
    queueMicrotask(populateFormFromData);
  }, [populateFormFromData]);

  // Intentional: track draft status based on content length.
  const computedPostStatus = useMemo(() => {
    if ((title + body).length < 5) {
      return null;
    }
    return postStatus ?? status.DRAFT;
  }, [title, body, postStatus]);

  // Defer the mutation call via queueMicrotask to avoid sync setState in effect.
  useEffect(() => {
    if (currentPostStatus !== status.DRAFT) return;
    if (title.length < 5 || body.length < 10) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    if (unsavedChanges) {
      queueMicrotask(() => savePost());
    }
  }, [
    debouncedValue,
    currentPostStatus,
    data?.title,
    data?.body,
    unsavedChanges,
    savePost,
    title,
    body,
  ]);

  // Redirect to the new post's edit URL once it has an id.
  useEffect(() => {
    if (!createData?.id) return;
    router.push(`create/${createData.id}`);
  }, [createData, router]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  useEffect(() => {
    if ((title + body).length < 5) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnsavedChanges(true);
  }, [title, body]);

  const handlePublish = () => {
    if (isDisabled) return;
    setShowPublishConfirm(true);
  };

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleBodyChange = useCallback((newBody: string) => {
    setBody(newBody);
  }, []);

  return (
    <>
      <EditorNav
        session={session}
        username={session?.user?.name || null}
        postStatus={computedPostStatus}
        unsavedChanges={unsavedChanges}
        onPublish={handlePublish}
        isDisabled={isDisabled}
        savedTime={savedTime}
        isSaving={saveStatus === "pending"}
      />

      <Transition show={showPublishConfirm} as={Fragment}>
        <Dialog
          onClose={() => setShowPublishConfirm(false)}
          className="relative z-50"
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </TransitionChild>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="mx-auto max-w-md rounded-xl border border-hairline bg-elevated p-8 text-center shadow-xl">
                <div className="mb-3 text-5xl">🚀</div>
                <DialogTitle className="font-display text-xl font-extrabold tracking-tight text-fg">
                  Ready to launch?
                </DialogTitle>
                <p className="mt-3 text-sm text-muted">
                  {`Your masterpiece "${title || "Untitled"}" is about to go live!`}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPublishConfirm(false)}
                    className="secondary-button"
                  >
                    Maybe later
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={hasLoadingState}
                    className="primary-button disabled:cursor-not-allowed"
                  >
                    {hasLoadingState ? "Working on it..." : "Let's do this!"}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {dataStatus === "pending" && postId && (
        <div className="fixed left-0 top-0 z-40 flex h-screen w-screen items-center justify-center">
          <div className="z-50 flex flex-col items-center rounded-lg border border-hairline bg-elevated px-5 py-2 opacity-100">
            <div className="loader-dots relative mt-2 block h-5 w-20">
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
            </div>
            <div className="mt-2 text-center font-mono text-xs text-faint">
              Fetching post data.
            </div>
          </div>
          <div className="z-60 absolute bottom-0 left-0 right-0 top-0 bg-black opacity-25" />
        </div>
      )}

      {isPublishing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-0 top-0 z-40 flex h-screen w-screen items-center justify-center"
        >
          <div className="z-50 flex flex-col items-center rounded-xl border border-hairline bg-elevated px-8 py-6 opacity-100 shadow-xl">
            <div className="loader-dots relative mt-2 block h-5 w-20">
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
              <div className="absolute top-0 mt-1 h-3 w-3 rounded-full bg-gradient-to-r from-accent to-accent shadow-sm"></div>
            </div>
            <div className="mt-4 font-display text-lg font-extrabold tracking-tight text-fg">
              Reviewing your post…
            </div>
            <div className="mt-1 text-center font-mono text-xs text-faint">
              {reviewLine}
            </div>
          </div>
          <div className="z-60 absolute bottom-0 left-0 right-0 top-0 bg-black opacity-25" />
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-label text-faint">
              Article
            </span>

            <div className="flex items-center gap-4">
              {(createData?.id || postId) && (
                <button
                  type="button"
                  onClick={() => {
                    const draftUrl = `${window.location.origin}/draft/${createData?.id || postId}`;
                    navigator.clipboard.writeText(draftUrl);
                    toast.success("Draft link copied!");
                  }}
                  className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
                >
                  <Share2 className="h-4 w-4" />
                  Share Draft
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewPreview((current) => !current)}
                className="flex items-center gap-2 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                {viewPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {viewPreview ? (
            // Preview mode - matches published article width
            <section className="px-6 py-8">
              <article
                className="prose prose-neutral mx-auto max-w-none dark:prose-invert lg:prose-lg"
                style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                <h1>{title || "Untitled"}</h1>
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
            // Edit mode - TipTap Editor
            <WriteTab
              initialContent={body}
              title={title}
              onTitleChange={handleTitleChange}
              onBodyChange={handleBodyChange}
              titlePlaceholder="Article title"
              editorPlaceholder="Start writing your article..."
              className="min-h-[500px]"
            />
          )}

          <div className="border-t border-hairline p-4">
            <TagInput
              tags={tags}
              onChange={setTags}
              maxTags={5}
              label="Tags"
              helpText="Add up to 5 tags to help readers find your post."
            />
          </div>

          <Disclosure>
            {({ open: disclosureOpen }) => (
              <>
                <DisclosureButton className="flex w-full items-center justify-between border-t border-hairline px-4 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-fg">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    More Options
                    <span className="font-mono text-xs font-normal uppercase tracking-label text-faint">
                      (SEO)
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`${disclosureOpen ? "rotate-180" : ""} h-5 w-5 text-faint transition-transform`}
                  />
                </DisclosureButton>
                <DisclosurePanel className="border-t border-hairline bg-inset p-4">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="excerpt" className="eyebrow mb-1.5 block">
                        <span className="slash">{"// "}</span>Excerpt
                      </label>
                      <textarea
                        maxLength={156}
                        id="excerpt"
                        rows={3}
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder={
                          removeMarkdown(body, {}).substring(0, 155) ||
                          "Brief description of your post..."
                        }
                        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <p className="mt-1 text-xs text-faint">
                        What readers will see before clicking. Good SEO
                        descriptions are 140-156 characters.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="canonicalUrl"
                        className="eyebrow mb-1.5 block"
                      >
                        <span className="slash">{"// "}</span>Canonical URL
                      </label>
                      <input
                        id="canonicalUrl"
                        type="text"
                        placeholder="https://www.somesite.com/i-posted-here-first"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <p className="mt-1 text-xs text-faint">
                        Add this if the post was originally published elsewhere.
                      </p>
                    </div>

                    {postId && (
                      <div>
                        <label className="eyebrow mb-1.5 block">
                          <span className="slash">{"// "}</span>Draft Preview
                          Link
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={PREVIEW_URL}
                            className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-muted"
                          />
                          <button
                            onClick={handleCopyToClipboard}
                            type="button"
                            className="rounded-md border border-hairline bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-fg"
                          >
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-faint">
                          Share this link with others to preview your draft.
                        </p>
                      </div>
                    )}
                  </div>
                </DisclosurePanel>
              </>
            )}
          </Disclosure>

          <div className="flex items-center justify-end gap-3 border-t border-hairline px-4 py-3">
            <button
              type="button"
              onClick={async () => {
                if (isDisabled) return;
                await savePost();
                toast.success("Draft saved!");
              }}
              disabled={!unsavedChanges || isDisabled}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                unsavedChanges && !isDisabled
                  ? "border-hairline bg-surface text-muted hover:bg-elevated hover:text-fg"
                  : "cursor-not-allowed border-hairline bg-inset text-faint"
              }`}
            >
              {unsavedChanges ? "Save Draft" : "Saved"}
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isDisabled}
              className="primary-button disabled:cursor-not-allowed"
            >
              {currentPostStatus === status.PUBLISHED
                ? "Save Changes"
                : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const Create = ({ session }: { session: Session | null }) => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      }
    >
      <CreateContent session={session} />
    </Suspense>
  );
};

export default Create;
