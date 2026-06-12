"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { api } from "@/server/trpc/react";
import { getHostname } from "@/utils/url";
import { buildContentHref } from "@/server/lib/content-url";
import { useLinkMetadata } from "@/components/PostEditor/hooks/useLinkMetadata";
import {
  AaToggle,
  MdTextarea,
  RichToolbar,
  useRichText,
} from "@/components/RichText";

export type ComposeMode = "discussion" | "link" | "article";

const TITLE_MAX = 300;
const TAG_MAX = 4;

/**
 * Reddit-style create modal: Discussion + Link publish immediately (after the
 * automated pass); Article hands off to the full editor. Mirrors
 * ui_kits/app/Compose.jsx → ComposeModal.
 */
export function ComposeModal({
  mode,
  username,
  onClose,
}: {
  mode: ComposeMode;
  username: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [tab, setTab] = useState<ComposeMode>(mode);
  const [title, setTitle] = useState("");
  const {
    text: body,
    setText: setBody,
    toolbar: bodyToolbar,
    setToolbar: setBodyToolbar,
    ref: bodyRef,
    exec: bodyExec,
  } = useRichText("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [done, setDone] = useState<{ href: string; label: string } | null>(
    null,
  );
  // Whether the in-flight mutation is a "Save draft" (success panel points at
  // /my-posts instead of the live post).
  const [savingDraft, setSavingDraft] = useState(false);

  const { mutate: create, status: createStatus } =
    api.content.create.useMutation({
      onSuccess: (post) => {
        void utils.content.getFeed.invalidate();
        // Publishing can earn a badge (e.g. first_post) — refresh the banner
        // and the app-wide celebration so the confetti fires right away.
        void utils.engagement.onboardingWins.invalidate();
        void utils.engagement.uncelebratedBadges.invalidate();
        if (savingDraft) {
          toast.success("Saved to drafts");
          setDone({ href: "/my-posts?tab=drafts", label: "View drafts" });
          return;
        }
        // Canonical path per kind (discussions → /d/); fall back to the feed
        // when we can't build a stable URL.
        const href =
          (post?.slug &&
            buildContentHref({
              type: post.type,
              slug: post.slug,
              authorUsername: username,
            })) ||
          "/";
        setDone({ href, label: "View post" });
      },
      onError: (err) => {
        setSavingDraft(false);
        toast.error(err.message || "Couldn't post. Try again.");
        Sentry.captureException(err);
      },
    });

  // Display domain (scheme optional while typing, "www." stripped for the chip).
  const domain =
    getHostname(url.startsWith("http") ? url : `https://${url}`)?.replace(
      /^www\./,
      "",
    ) ?? null;

  // Normalised URL we feed to the OG metadata fetcher (only when it looks valid).
  const normalisedUrl =
    tab === "link" && domain
      ? url.startsWith("http")
        ? url
        : `https://${url}`
      : "";
  const { metadata: linkMeta, isLoading: linkMetaLoading } =
    useLinkMetadata(normalisedUrl);
  // Auto-fill from the link's OG metadata; the user's typed title overrides it.
  const metaTitle = tab === "link" ? (linkMeta?.title?.trim() ?? "") : "";
  const metaDescription =
    tab === "link" ? (linkMeta?.description?.trim() ?? "") : "";
  const metaImage = tab === "link" ? (linkMeta?.image ?? null) : null;
  const effectiveTitle = title.trim() || metaTitle;
  const previewImage = metaImage;
  const previewTitle = effectiveTitle;

  const canPost =
    effectiveTitle.length > 0 &&
    (tab === "discussion" || (tab === "link" && !!domain));
  // Drafts only need a title — slug/edit resume keys off it. Discussion only.
  const canSaveDraft = tab === "discussion" && effectiveTitle.length > 0;
  const posting = createStatus === "pending";

  const addTag = (t: string) => {
    const v = t.trim().replace(/^#/, "");
    if (
      v &&
      tags.length < TAG_MAX &&
      !tags.some((x) => x.toLowerCase() === v.toLowerCase())
    ) {
      setTags([...tags, v]);
    }
    setDraft("");
  };

  const submit = (published = true) => {
    if (posting) return;
    if (published ? !canPost : !canSaveDraft) return;
    setSavingDraft(!published);
    const externalUrl =
      tab === "link"
        ? url.startsWith("http")
          ? url
          : `https://${url}`
        : null;
    // Only persist an absolute http(s) image — OG tags sometimes hand back garbage.
    const httpImage =
      metaImage && /^https?:\/\//i.test(metaImage) ? metaImage : null;
    create({
      type: tab === "link" ? "LINK" : "DISCUSSION",
      title: effectiveTitle,
      body: body.trim() || null,
      externalUrl,
      // Carry the link's own metadata so the feed card has a blurb + thumbnail.
      excerpt:
        tab === "link" && metaDescription
          ? metaDescription.slice(0, 300)
          : null,
      imageUrl: tab === "link" ? httpImage : null,
      tags,
      published,
    });
  };

  const tabs: [ComposeMode, string][] = [
    ["discussion", "Discussion"],
    ["link", "Link"],
    ["article", "Article"],
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-6 pb-6 pt-[clamp(1rem,6vh,5rem)]"
      style={{ background: "rgba(4,5,7,0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create a post"
        className="w-full max-w-[640px] overflow-hidden rounded-xl border border-strong bg-elevated shadow-lg"
      >
        {done ? (
          <div className="p-6">
            <p className="eyebrow">
              <span className="slash">{"// "}</span>
              {savingDraft ? "saved" : "posted"}
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">
              {savingDraft ? "Draft saved." : "You're live."}
            </h3>
            <p className="mt-3 font-mono text-xs leading-relaxed text-faint">
              {savingDraft
                ? "It's waiting in My posts under drafts — pick it back up whenever you're ready to publish."
                : "Your post is in the feed now. Be around to reply — the best threads come from the author sticking around."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="secondary-button"
                onClick={() => {
                  router.push(done.href);
                  onClose();
                }}
              >
                {done.label}
              </button>
              <button className="primary-button" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-5">
              <p className="eyebrow">
                <span className="slash">{"// "}</span>create a post
              </p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-base leading-none text-faint hover:text-muted"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 px-6 pt-4">
              {tabs.map(([id, label]) => {
                const on = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 rounded-md border px-2 py-2 text-sm font-semibold transition-colors ${
                      on
                        ? "border-accent bg-accent/10 text-accent-soft"
                        : "border-hairline text-muted hover:text-fg"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {tab === "article" ? (
              <div className="px-6 pb-6 pt-5">
                <h3 className="font-display text-xl font-extrabold tracking-tight">
                  Write a full article
                </h3>
                <p className="mb-5 mt-2 text-sm leading-relaxed text-muted">
                  Articles open in a focused editor — cover image, headings,
                  code blocks, the works. Here&apos;s how publishing works
                  before you start:
                </p>
                <ul className="flex flex-col gap-3">
                  {[
                    [
                      "Editors review first",
                      "You submit a draft and a human editor reads it before it goes live — usually within a day.",
                    ],
                    [
                      "Cross-posting is welcome",
                      "Published it elsewhere? Add a canonical link in the editor and we'll point search engines to your original.",
                    ],
                    [
                      "Your draft is always saved",
                      "Step away whenever. It'll be waiting in your profile under drafts.",
                    ],
                  ].map(([h, d]) => (
                    <li
                      key={h}
                      className="flex items-start gap-3 border-t border-hairline pt-3 text-sm leading-snug"
                    >
                      <span className="font-mono text-[13px] text-accent">
                        →
                      </span>
                      <span>
                        <span className="font-semibold text-fg">{h}.</span>{" "}
                        <span className="text-muted">{d}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col gap-4 px-6 pb-6 pt-5">
                <textarea
                  value={title || metaTitle}
                  maxLength={TITLE_MAX}
                  onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
                  rows={1}
                  autoFocus
                  placeholder={
                    tab === "link"
                      ? "Title — what should people know before they click?"
                      : "An honest, specific title"
                  }
                  className="w-full resize-none border-0 bg-transparent font-display text-xl font-bold leading-tight tracking-tight text-fg outline-none placeholder:text-faint focus:outline-none focus:ring-0"
                />

                {tab === "link" && (
                  <div>
                    <div className="flex items-center gap-2 rounded-md border border-hairline bg-inset px-3.5 py-2.5">
                      <span className="font-mono text-xs uppercase tracking-[0.1em] text-faint">
                        URL
                      </span>
                      <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://…"
                        className="flex-1 border-0 bg-transparent font-mono text-sm text-fg outline-none placeholder:text-faint focus:outline-none focus:ring-0"
                      />
                      {url && !domain && (
                        <span className="font-mono text-[10px] text-warning">
                          check the url
                        </span>
                      )}
                    </div>

                    {domain && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-hairline bg-surface">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt={previewTitle || "Link preview"}
                            className="aspect-video w-full bg-inset object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex aspect-video w-full items-center justify-center bg-inset">
                            <span className="font-mono text-[11px] text-faint">
                              {linkMetaLoading
                                ? "fetching preview…"
                                : "preview image"}
                            </span>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-display text-base font-bold leading-snug tracking-tight text-fg">
                            {previewTitle || "Your title will appear here"}
                          </h4>
                          <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] text-faint">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-accent" />
                            <span className="truncate">{domain}</span>
                          </div>
                          {(metaDescription || body.trim()) && (
                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                              {metaDescription || body.trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-hidden rounded-md border border-hairline bg-canvas focus-within:border-strong">
                  <div className="flex flex-col gap-2 p-2.5">
                    {bodyToolbar && (
                      <RichToolbar
                        exec={bodyExec}
                        onSwitchToMarkdown={() => setBodyToolbar(false)}
                      />
                    )}
                    <MdTextarea
                      ref={bodyRef}
                      value={body}
                      onValueChange={setBody}
                      minRows={tab === "link" ? 3 : 6}
                      placeholder={
                        tab === "link"
                          ? "Add your take — why is this worth the click? (optional)"
                          : "Body — context, what you tried, what you're asking. Markdown supported. (optional)"
                      }
                      className="px-1"
                    />
                  </div>
                  <div className="flex items-center border-t border-hairline bg-inset px-2.5 py-2">
                    <AaToggle
                      on={bodyToolbar}
                      onToggle={() => setBodyToolbar(!bodyToolbar)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-inset px-2.5 py-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 font-mono text-xs text-accent-soft"
                    >
                      #{t}
                      <button
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        aria-label={`Remove ${t}`}
                        className="leading-none text-accent-soft"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {tags.length < TAG_MAX && (
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag(draft);
                        } else if (
                          e.key === "Backspace" &&
                          !draft &&
                          tags.length
                        ) {
                          setTags(tags.slice(0, -1));
                        }
                      }}
                      placeholder={
                        tags.length
                          ? "Add another…"
                          : `Add up to ${TAG_MAX} tags…`
                      }
                      className="min-w-[120px] flex-1 border-0 bg-transparent font-mono text-xs text-fg outline-none placeholder:text-faint focus:outline-none focus:ring-0"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline bg-surface px-6 py-4">
              <span className="font-mono text-[10px] text-faint">
                Be helpful · no spam ·{" "}
                <Link href="/code-of-conduct" className="text-accent-soft">
                  code of conduct
                </Link>
              </span>
              <div className="ml-auto flex gap-3">
                <button className="secondary-button" onClick={onClose}>
                  Cancel
                </button>
                {tab === "article" ? (
                  <button
                    className="primary-button"
                    onClick={() => {
                      router.push("/create");
                      onClose();
                    }}
                  >
                    Open the editor →
                  </button>
                ) : (
                  <>
                    {tab === "discussion" && (
                      <button
                        className="secondary-button"
                        disabled={!canSaveDraft || posting}
                        onClick={() => submit(false)}
                      >
                        {posting && savingDraft ? "Saving…" : "Save draft"}
                      </button>
                    )}
                    <button
                      className="primary-button"
                      disabled={!canPost || posting}
                      onClick={() => submit(true)}
                    >
                      {posting && !savingDraft ? "Posting…" : "Post"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
