"use client";

import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import React, {
  useState,
  useEffect,
  Fragment,
  useCallback,
  Suspense,
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
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { usePrompt } from "@/components/PromptService";
import { Switch } from "@/components/Switch/Switch";
import copy from "copy-to-clipboard";
import {
  type PostStatus,
  getPostStatus,
  isValidScheduleTime,
  status,
} from "@/utils/post";
import {
  PenLine,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Settings2,
  Share2,
} from "lucide-react";
import EditorNav from "./navigation";
import { type Session } from "next-auth";
import { motion, LayoutGroup } from "framer-motion";

// Import new PostEditor components
import { WriteTab } from "@/components/PostEditor/tabs/WriteTab";
import { LinkTab } from "@/components/PostEditor/tabs/LinkTab";
import { TagInput } from "@/components/PostEditor/components/TagInput";
import type { LinkMetadata } from "@/components/PostEditor/hooks/useLinkMetadata";

type PostType = "write" | "link";

const TAB_CONFIG = [
  {
    id: "write" as const,
    label: "Write",
    icon: PenLine,
    description: "Write an article",
  },
  {
    id: "link" as const,
    label: "Link",
    icon: LinkIcon,
    description: "Share a link",
  },
];

// Inner component that uses useSearchParams
const CreateContent = ({ session }: { session: Session | null }) => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const postId = params?.paramsArr?.[0] || "";

  // Tab state from URL
  const initialTab = (searchParams.get("tab") as PostType) || "write";
  const [activeTab, setActiveTab] = useState<PostType>(initialTab);

  // Handle tab change with URL update
  const handleTabChange = useCallback(
    (tab: PostType) => {
      setActiveTab(tab);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("tab", tab);
      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [publishedTime, setPublishedTime] = useState("");

  // Link tab state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);

  // UI state
  const [viewPreview, setViewPreview] = useState(false);
  const [savedTime, setSavedTime] = useState("");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isPostScheduled, setIsPostScheduled] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(true);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [postStatus, setPostStatus] = useState<PostStatus | null>(null);

  // Tab locking - disable switching when content exists
  const hasWriteContent = body.trim().length > 0;
  const hasLinkContent = linkUrl.trim().length > 0;
  const isWriteTabDisabled = hasLinkContent && activeTab === "link";
  const isLinkTabDisabled = hasWriteContent && activeTab === "write";

  const { setUnsavedChanges: _setUnsaved } = usePrompt();

  useEffect(() => {
    _setUnsaved(unsavedChanges);
  }, [unsavedChanges, _setUnsaved]);

  // Debounce for auto-save
  const debouncedValue = useDebounce(title + body, 1500);

  // TRPC mutations
  const {
    mutate: publish,
    status: publishStatus,
    data: publishData,
  } = api.content.publish.useMutation({
    onError(error) {
      toast.error("Error saving settings.");
      Sentry.captureException(error);
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

  // Fetch existing draft for editing
  const {
    data,
    status: dataStatus,
    isError: draftFetchError,
  } = api.content.editDraft.useQuery(
    { id: postId },
    {
      enabled: !!postId && shouldRefetch,
    },
  );

  const PREVIEW_URL = `${process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://www.codu.co"}/draft/${createData?.id || postId}`;

  const handleCopyToClipboard = () => {
    copy(PREVIEW_URL);
    setCopied(true);
  };

  // Error handling
  useEffect(() => {
    if (isError) {
      toast.error("Error saving");
    }
    if (draftFetchError) {
      notFound();
    }
  }, [draftFetchError, isError]);

  useEffect(() => {
    if (shouldRefetch) {
      setShouldRefetch(!(dataStatus === "success"));
    }
  }, [dataStatus, shouldRefetch]);

  useEffect(() => {
    const to = setTimeout(setCopied, 2000, false);
    return () => clearTimeout(to);
  }, [copied]);

  // Get form data for saving
  const getFormData = useCallback(() => {
    const currentExcerpt =
      excerpt || removeMarkdown(body, {}).substring(0, 155);
    return {
      title,
      body,
      tags,
      excerpt: currentExcerpt,
      canonicalUrl: canonicalUrl || undefined,
      published: publishedTime,
    };
  }, [title, body, tags, excerpt, canonicalUrl, publishedTime]);

  // Save post - returns the post ID (either new or existing)
  const savePost = useCallback(async (): Promise<string> => {
    const formData = getFormData();

    if (!postId) {
      // Create new content
      const result = await create({
        type: activeTab === "link" ? "LINK" : "POST",
        title: activeTab === "link" ? linkTitle || title : formData.title,
        body: activeTab === "link" ? "" : formData.body,
        excerpt:
          activeTab === "link"
            ? linkMetadata?.description || ""
            : formData.excerpt,
        canonicalUrl: activeTab === "write" ? formData.canonicalUrl : undefined,
        externalUrl: activeTab === "link" ? linkUrl : undefined,
        tags: formData.tags,
        published: false,
      });
      setUnsavedChanges(false);
      return result.id;
    } else {
      await save({
        id: postId,
        title: activeTab === "link" ? linkTitle || title : formData.title,
        body: activeTab === "link" ? "" : formData.body,
        excerpt:
          activeTab === "link"
            ? linkMetadata?.description || ""
            : formData.excerpt,
        canonicalUrl: activeTab === "write" ? formData.canonicalUrl : undefined,
        externalUrl: activeTab === "link" ? linkUrl : undefined,
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
  }, [
    getFormData,
    postId,
    create,
    save,
    activeTab,
    linkTitle,
    title,
    linkUrl,
    linkMetadata,
  ]);

  const hasLoadingState =
    publishStatus === "pending" ||
    saveStatus === "pending" ||
    (!!postId && dataStatus === "pending");

  const currentPostStatus = data?.publishedAt
    ? getPostStatus(new Date(data.publishedAt))
    : status.DRAFT;

  // Handle publish/submit
  const onSubmit = async () => {
    // Validate content BEFORE saving
    if (activeTab === "write") {
      // For write tab, validate markdoc syntax
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
    } else {
      // For link tab, validate URL and title
      if (!linkUrl || !linkTitle) {
        toast.error("URL and title are required for link posts");
        return;
      }
    }

    try {
      // Save the post and get the ID (important for new posts)
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

      // Additional content validation for write tab
      if (activeTab === "write") {
        ConfirmContentSchema.parse(formData);
      }

      // Use the saved post ID (not the one from URL params which might be stale)
      // Use mutateAsync pattern for proper await
      const publishResult = await new Promise<{ slug: string }>(
        (resolve, reject) => {
          publish(
            {
              id: savedPostId,
              published: true,
              publishTime:
                isPostScheduled && publishedTime
                  ? new Date(publishedTime)
                  : new Date(),
            },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            },
          );
        },
      );

      // Clear states immediately
      setUnsavedChanges(false);
      setShowPublishConfirm(false);

      // Redirect based on scheduling
      if (session?.user?.username && publishResult?.slug) {
        if (isPostScheduled) {
          toast.success("Post scheduled!");
          router.push("/my-posts?tab=scheduled");
        } else {
          toast.success("Published!");
          router.push(`/${session.user.username}/${publishResult.slug}`);
        }
      }
    } catch (err) {
      if (err instanceof ZodError) {
        return toast.error(err.issues[0].message);
      } else {
        console.error("Publish error:", err);
        return toast.error("Something went wrong when trying to publish.");
      }
    }
  };

  // Load existing data
  useEffect(() => {
    if (!data) return;
    const {
      body: existingBody,
      excerpt: existingExcerpt,
      title: existingTitle,
      tags: existingTags,
      publishedAt,
      canonicalUrl: existingCanonical,
      type: postType,
      externalUrl,
    } = data;

    // Handle link posts vs article posts (case-insensitive check)
    if (postType?.toLowerCase() === "link") {
      setLinkTitle(existingTitle || "");
      setLinkUrl(externalUrl || "");
      // Only switch tab if not already on link tab (preserve URL param on initial load)
      if (activeTab !== "link") {
        setActiveTab("link");
      }
    } else {
      setTitle(existingTitle || "");
      setBody(existingBody || "");
      setCanonicalUrl(existingCanonical || "");
    }

    setExcerpt(existingExcerpt || "");
    setTags(existingTags.map(({ tag }) => tag.title.toUpperCase()));
    setPublishedTime(publishedAt || "");
    setIsPostScheduled(
      publishedAt ? new Date(publishedAt) > new Date() : false,
    );
    setPostStatus(
      publishedAt ? getPostStatus(new Date(publishedAt)) : status.DRAFT,
    );
  }, [data, activeTab]);

  // Update post status based on content
  useEffect(() => {
    if ((title + body).length < 5) {
      setPostStatus(null);
    } else if (postStatus === null) {
      setPostStatus(status.DRAFT);
    }
  }, [title, body, postStatus]);

  // Auto-save for drafts
  useEffect(() => {
    if (currentPostStatus !== status.DRAFT) return;
    // For write tab, require both title and body; for link tab, require url and title
    if (activeTab === "write") {
      if (title.length < 5 || body.length < 10) return;
    } else {
      if (!linkUrl || !linkTitle) return;
    }
    if (debouncedValue === (data?.title || "") + data?.body) return;
    if (unsavedChanges) savePost();
  }, [
    debouncedValue,
    currentPostStatus,
    data?.title,
    data?.body,
    unsavedChanges,
    savePost,
    title,
    body,
    activeTab,
    linkUrl,
    linkTitle,
  ]);

  // Redirect after creating new post - preserve tab parameter
  useEffect(() => {
    if (!createData?.id) return;
    const tabParam = activeTab !== "write" ? `?tab=${activeTab}` : "";
    router.push(`create/${createData.id}${tabParam}`);
  }, [createData, router, activeTab]);

  // Check if form has enough content
  const hasContent =
    activeTab === "write"
      ? title.length >= 5 && body.length >= 10
      : linkUrl.length > 0 && linkTitle.length > 0;

  const isDisabled = hasLoadingState || !hasContent;

  // Track unsaved changes for write tab
  useEffect(() => {
    if (activeTab !== "write") return;
    if ((title + body).length < 5) return;
    setUnsavedChanges(true);
  }, [title, body, activeTab]);

  // Track unsaved changes for link tab
  useEffect(() => {
    if (activeTab !== "link") return;
    if (!linkUrl && !linkTitle) return;
    setUnsavedChanges(true);
  }, [linkUrl, linkTitle, activeTab]);

  // Note: Redirect after publish is now handled directly in onSubmit for better flow control

  const handlePublish = () => {
    if (isDisabled) return;
    setShowPublishConfirm(true);
  };

  // Handle content changes from WriteTab
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleBodyChange = useCallback((newBody: string) => {
    setBody(newBody);
  }, []);

  // Handle link metadata
  const handleMetadataFetched = useCallback(
    (metadata: LinkMetadata) => {
      setLinkMetadata(metadata);
      if (metadata.title && !linkTitle) {
        setLinkTitle(metadata.title);
      }
    },
    [linkTitle],
  );

  // Get publish button text
  const getPublishButtonText = () => {
    if (currentPostStatus === status.PUBLISHED) return "Save changes";
    if (currentPostStatus === status.DRAFT) {
      return isPostScheduled ? "Schedule" : "Publish now";
    }
    if (currentPostStatus === status.SCHEDULED) {
      return isPostScheduled ? "Update schedule" : "Publish now";
    }
    return "Publish";
  };

  return (
    <>
      <EditorNav
        session={session}
        username={session?.user?.name || null}
        postStatus={postStatus}
        unsavedChanges={unsavedChanges}
        onPublish={handlePublish}
        isDisabled={isDisabled}
        savedTime={savedTime}
        isSaving={saveStatus === "pending"}
      />

      {/* Whimsical Pre-Publish Dialog */}
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
              <DialogPanel className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
                <div className="mb-3 text-5xl">
                  {isPostScheduled ? "⏰" : activeTab === "link" ? "🔗" : "🚀"}
                </div>
                <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-white">
                  {isPostScheduled
                    ? "Time travel activated!"
                    : activeTab === "link"
                      ? "Spread the word!"
                      : "Ready to launch?"}
                </DialogTitle>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                  {isPostScheduled
                    ? `"${title || "Untitled"}" will appear on ${new Date(publishedTime).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} at ${new Date(publishedTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                    : activeTab === "link"
                      ? "Share this gem with the community?"
                      : `Your masterpiece "${title || "Untitled"}" is about to go live!`}
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPublishConfirm(false)}
                    className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {isPostScheduled
                      ? "Change my mind"
                      : activeTab === "link"
                        ? "Not yet"
                        : "Maybe later"}
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={hasLoadingState}
                    className="rounded-lg bg-pink-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
                  >
                    {hasLoadingState
                      ? "Working on it..."
                      : isPostScheduled
                        ? "Set it and forget it!"
                        : activeTab === "link"
                          ? "Share it!"
                          : "Let's do this!"}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Loading state */}
      {dataStatus === "pending" && postId && (
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

      {/* Main content area - single card layout */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {/* Tab Bar with pink underline */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <LayoutGroup id="editor-tabs">
              <div className="flex gap-1">
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDisabledTab =
                    tab.id === "write" ? isWriteTabDisabled : isLinkTabDisabled;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => !isDisabledTab && handleTabChange(tab.id)}
                      disabled={isDisabledTab}
                      title={
                        isDisabledTab
                          ? `Clear ${tab.id === "write" ? "link URL" : "article content"} to switch tabs`
                          : tab.description
                      }
                      className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isDisabledTab
                          ? "cursor-not-allowed opacity-50"
                          : isActive
                            ? "text-neutral-900 dark:text-white"
                            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-indicator"
                          className="absolute inset-x-0 -bottom-3 h-0.5 bg-pink-600"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            {/* Share Draft & Preview toggle */}
            <div className="flex items-center gap-4">
              {activeTab === "write" && (createData?.id || postId) && (
                <button
                  type="button"
                  onClick={() => {
                    const draftUrl = `${window.location.origin}/draft/${createData?.id || postId}`;
                    navigator.clipboard.writeText(draftUrl);
                    toast.success("Draft link copied!");
                  }}
                  className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-500"
                >
                  <Share2 className="h-4 w-4" />
                  Share Draft
                </button>
              )}
              {activeTab === "write" && (
                <button
                  type="button"
                  onClick={() => setViewPreview((current) => !current)}
                  className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
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
              )}
            </div>
          </div>

          {/* Editor Content */}
          {activeTab === "write" ? (
            viewPreview ? (
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
            )
          ) : (
            // Link tab
            <LinkTab
              url={linkUrl}
              onUrlChange={setLinkUrl}
              title={linkTitle}
              onTitleChange={setLinkTitle}
              onMetadataFetched={handleMetadataFetched}
              urlPlaceholder="https://example.com/interesting-article"
              titlePlaceholder="Link title (auto-populated from URL)"
            />
          )}

          {/* Tags section - with divider */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
            <TagInput
              tags={tags}
              onChange={setTags}
              maxTags={5}
              label="Tags"
              helpText="Add up to 5 tags to help readers find your post."
            />
          </div>

          {/* More Options - collapsible accordion (Write tab only) */}
          {activeTab === "write" && (
            <Disclosure>
              {({ open: disclosureOpen }) => (
                <>
                  <DisclosureButton className="flex w-full items-center justify-between border-t border-neutral-200 px-4 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      More Options
                      <span className="text-xs font-normal text-neutral-500">
                        (SEO, scheduling)
                      </span>
                    </span>
                    <ChevronDownIcon
                      className={`${disclosureOpen ? "rotate-180" : ""} h-5 w-5 text-neutral-400 transition-transform`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <div className="space-y-6">
                      {/* Excerpt */}
                      <div>
                        <label
                          htmlFor="excerpt"
                          className="mb-1 block text-sm font-medium text-neutral-800 dark:text-white"
                        >
                          Excerpt
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
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                        />
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          What readers will see before clicking. Good SEO
                          descriptions are 140-156 characters.
                        </p>
                      </div>

                      {/* Schedule post - show for new drafts and unpublished posts */}
                      {(!data?.publishedAt ||
                        new Date(data.publishedAt) > new Date()) && (
                        <div>
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
                              value={publishedTime}
                              onChange={(e) => setPublishedTime(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                            />
                          )}
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Publish your post at a later time.
                          </p>
                        </div>
                      )}

                      {/* Canonical URL */}
                      <div>
                        <label
                          htmlFor="canonicalUrl"
                          className="mb-1 block text-sm font-medium text-neutral-800 dark:text-white"
                        >
                          Canonical URL
                        </label>
                        <input
                          id="canonicalUrl"
                          type="text"
                          placeholder="https://www.somesite.com/i-posted-here-first"
                          value={canonicalUrl}
                          onChange={(e) => setCanonicalUrl(e.target.value)}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500"
                        />
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Add this if the post was originally published
                          elsewhere.
                        </p>
                      </div>

                      {/* Draft preview link */}
                      {postId && (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-neutral-800 dark:text-white">
                            Draft Preview Link
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={PREVIEW_URL}
                              className="flex-1 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            />
                            <button
                              onClick={handleCopyToClipboard}
                              type="button"
                              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                            >
                              {copied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Share this link with others to preview your draft.
                          </p>
                        </div>
                      )}
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
            {activeTab === "write" && (
              <button
                type="button"
                onClick={async () => {
                  if (isDisabled) return;
                  await savePost();
                  toast.success("Draft saved!");
                }}
                disabled={!unsavedChanges || isDisabled}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  unsavedChanges && !isDisabled
                    ? "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                    : "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
                }`}
              >
                {unsavedChanges ? "Save Draft" : "Saved"}
              </button>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={isDisabled}
              className="rounded-lg bg-pink-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
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

// Wrapper component with Suspense for useSearchParams
const Create = ({ session }: { session: Session | null }) => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
        </div>
      }
    >
      <CreateContent session={session} />
    </Suspense>
  );
};

export default Create;
