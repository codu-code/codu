"use client";

import * as Sentry from "@sentry/nextjs";
import React from "react";
import Link from "next/link";
import { UnifiedContentCard } from "@/components/UnifiedContentCard";
import { LinkIcon } from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { Heading } from "@/components/ui-components/heading";
import { FollowButton, Tag } from "@/components/ds";
import { toast } from "sonner";

type Props = {
  session: Session | null;
  isOwner: boolean;
  profile: {
    posts: {
      publishedAt: string | null;
      title: string;
      excerpt: string | null;
      slug: string;
      readingTime: number | null;
      id: string;
    }[];
    accountLocked: boolean;
    id: string;
    username: string | null;
    name: string;
    image: string;
    bio: string;
    websiteUrl: string;
    location: string;
    topics: string[];
    createdAt: string;
  };
};

const Profile = ({ profile, isOwner, session }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromParams = searchParams?.get("tab");

  const { mutate: banUser } = api.admin.ban.useMutation({
    onSettled() {
      router.refresh();
    },
  });

  const { mutate: unbanUser } = api.admin.unban.useMutation({
    onSettled() {
      router.refresh();
    },
  });

  const { data: followCounts } = api.follow.counts.useQuery({
    userId: profile.id,
  });

  const [listView, setListView] = React.useState<
    null | "followers" | "following"
  >(null);
  const { data: followersList } = api.follow.getFollowers.useQuery(
    { userId: profile.id },
    { enabled: listView === "followers" },
  );
  const { data: followingList } = api.follow.getFollowing.useQuery(
    { userId: profile.id },
    { enabled: listView === "following" },
  );
  const listData = listView === "followers" ? followersList : followingList;

  const {
    name,
    username,
    image,
    bio,
    posts,
    websiteUrl,
    location,
    topics,
    createdAt,
    id,
    accountLocked,
  } = profile;

  const joinedLabel = createdAt
    ? `Joined ${new Date(createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })}`
    : null;

  const { data: engagement } = api.engagement.profileEngagement.useQuery(
    { userId: id },
    { enabled: !accountLocked },
  );

  const handleBanSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (accountLocked) return;

    const target = e.target as typeof e.target & {
      note: { value: string };
    };
    const note = target.note.value;

    try {
      await banUser({ userId: id, note });
    } catch (error) {
      toast.error("Error occurred banning user");
      Sentry.captureException(error);
    }
  };

  const TABS = ["Posts", "Achievements"] as const;
  type Tab = (typeof TABS)[number];
  const initialTab: Tab =
    tabFromParams === "achievements" ? "Achievements" : "Posts";
  const [tab, setTab] = React.useState<Tab>(initialTab);

  // Show a "Top helper" chip when the user is clearly engaged: a high point
  // total or any earned badge. Uses existing profileEngagement data only.
  const earnedBadges = engagement?.badges.filter((b) => b.earned) ?? [];
  const isTopHelper =
    !!engagement && (engagement.points >= 100 || earnedBadges.length > 0);

  return (
    <>
      <div className="text-900 mx-auto max-w-2xl px-4 text-black dark:text-white">
        {/* Header */}
        <div className="mt-2 flex flex-col gap-4 px-1 sm:flex-row sm:items-start">
          <div className="flex-shrink-0">
            {image && (
              <img
                className="h-24 w-24 rounded-full object-cover ring-4 ring-canvas"
                alt={`Avatar for ${name}`}
                src={image}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mb-0 font-display text-2xl font-extrabold tracking-tight text-fg">
                {name}
              </h1>
              {isTopHelper && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs text-accent-soft">
                  ◆ Top helper
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-sm text-faint">@{username}</p>
          </div>
          {session && !isOwner && !accountLocked && (
            <div className="flex-shrink-0">
              <FollowButton userId={id} />
            </div>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="mt-5 max-w-[60ch] px-1 leading-relaxed text-muted">
            {bio}
          </p>
        )}

        {/* Meta row */}
        {(joinedLabel || location || websiteUrl) && (
          <div className="mt-4 flex flex-wrap gap-4 px-1 font-mono text-xs text-faint">
            {joinedLabel && (
              <span className="inline-flex items-center gap-1">
                ◷ {joinedLabel}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                ◉ {location}
              </span>
            )}
            {websiteUrl && (
              <Link
                href={websiteUrl}
                target="blank"
                className="inline-flex items-center gap-1 text-accent-soft transition-colors hover:text-accent"
              >
                <LinkIcon className="h-4" />
                {getDomainFromUrl(websiteUrl)}
              </Link>
            )}
          </div>
        )}

        {/* Interests */}
        {topics && topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 px-1">
            {topics.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        {/* Stats row */}
        {!accountLocked && (
          <div className="mt-6 flex flex-wrap gap-8 px-1">
            <div>
              <div className="whitespace-nowrap font-display text-2xl font-extrabold text-fg">
                {posts.length}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
                Posts
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setListView((v) => (v === "followers" ? null : "followers"))
              }
              className="text-left transition-colors hover:opacity-80"
            >
              <div className="whitespace-nowrap font-display text-2xl font-extrabold text-fg">
                {followCounts?.followers ?? 0}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
                Followers
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                setListView((v) => (v === "following" ? null : "following"))
              }
              className="text-left transition-colors hover:opacity-80"
            >
              <div className="whitespace-nowrap font-display text-2xl font-extrabold text-fg">
                {followCounts?.following ?? 0}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-faint">
                Following
              </div>
            </button>
          </div>
        )}

        {/* Followers / Following list */}
        {!accountLocked && listView && (
          <div className="mt-6 rounded-xl border border-hairline bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold capitalize text-fg">
                {listView}
              </h3>
              <button
                type="button"
                onClick={() => setListView(null)}
                className="font-mono text-xs text-faint hover:text-fg"
              >
                close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {!listData && <p className="text-sm text-muted">Loading…</p>}
              {listData && listData.length === 0 && (
                <p className="text-sm text-muted">No {listView} yet.</p>
              )}
              {listData?.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <img
                    src={u.image || "/images/person.png"}
                    className="h-9 w-9 rounded-full object-cover"
                    alt=""
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${u.username}`}
                      className="block truncate text-sm font-semibold text-fg hover:text-accent"
                    >
                      {u.name || u.username}
                    </Link>
                    <p className="truncate text-xs text-muted">@{u.username}</p>
                  </div>
                  {session && session.user?.id !== u.id && (
                    <FollowButton userId={u.id} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {accountLocked ? (
          <div className="mt-8 flex items-center justify-between border-b border-hairline pb-4 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
            <Heading level={1}>Account locked 🔒</Heading>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-8 flex gap-5 border-b border-hairline">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 pb-2 pt-1 text-sm transition-colors ${
                    t === tab
                      ? "border-accent font-semibold text-fg"
                      : "border-transparent font-medium text-muted hover:text-fg"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Posts tab */}
            {tab === "Posts" && (
              <div className="mt-6">
                {posts.length ? (
                  posts.map(
                    ({
                      slug,
                      title,
                      excerpt,
                      readingTime,
                      publishedAt,
                      id,
                    }) => {
                      if (!publishedAt) return null;
                      return (
                        <div key={slug} className="relative">
                          <UnifiedContentCard
                            type="POST"
                            id={id}
                            title={title}
                            excerpt={excerpt}
                            slug={slug}
                            publishedAt={publishedAt}
                            readTimeMins={readingTime}
                            upvotes={0}
                            downvotes={0}
                            author={{
                              name: name,
                              username: username || "",
                              image: image,
                            }}
                          />
                          {isOwner && (
                            <Link
                              href={`/create/${id}`}
                              className="absolute right-2 top-2 rounded-md bg-elevated px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-fg"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="py-4 font-medium text-muted">
                    Nothing published yet... 🥲
                  </p>
                )}
              </div>
            )}

            {/* Achievements tab */}
            {tab === "Achievements" && (
              <div className="mt-6">
                {engagement ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="card flex items-center gap-4">
                        <span className="text-3xl text-accent" aria-hidden>
                          ✦
                        </span>
                        <div>
                          <div className="font-display text-3xl font-extrabold leading-none text-fg">
                            {engagement.points}
                          </div>
                          <div className="mt-1 font-mono text-xs text-faint">
                            points
                          </div>
                        </div>
                      </div>
                      <div className="card flex items-center gap-4">
                        <span className="text-3xl" aria-hidden>
                          🔥
                        </span>
                        <div>
                          <div className="font-display text-3xl font-extrabold leading-none text-fg">
                            {engagement.currentStreak}
                          </div>
                          <div className="mt-1 font-mono text-xs text-faint">
                            day streak
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 mt-8 flex items-baseline justify-between">
                      <p className="eyebrow">
                        <span className="slash">{"// "}</span>badges
                      </p>
                      <span className="font-mono text-xs text-faint">
                        {earnedBadges.length} of {engagement.badges.length}{" "}
                        earned
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
                      {engagement.badges.map((b) => (
                        <div
                          key={b.key}
                          className={`flex flex-col items-center gap-2 text-center ${
                            b.earned ? "" : "opacity-40"
                          }`}
                          title={b.description}
                        >
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl ${
                              b.earned
                                ? "bg-accent text-on-accent"
                                : "bg-elevated text-faint"
                            }`}
                            aria-hidden
                          >
                            {b.earned ? b.emoji : "🔒"}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              b.earned ? "text-fg" : "text-faint"
                            }`}
                          >
                            {b.name}
                          </div>
                          <div className="font-mono text-[10px] leading-snug text-faint">
                            {b.description}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 font-mono text-xs text-faint">
                      {"// "}points come from posting and helpful contributions
                    </p>
                  </>
                ) : (
                  <p className="py-4 font-medium text-muted">
                    No achievements yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {session?.user?.role === "ADMIN" && (
        <div className="mx-auto mt-8 max-w-2xl border-t border-hairline px-4 pb-8 pt-6 text-center">
          <h4 className="mb-6 font-display text-2xl font-bold text-fg">
            Admin Control
          </h4>
          {accountLocked ? (
            <button
              onClick={() => unbanUser({ userId: id })}
              className="secondary-button"
            >
              Unban this user
            </button>
          ) : (
            <form className="flex flex-col" onSubmit={handleBanSubmit}>
              <label
                htmlFor="note"
                className="block text-sm font-medium leading-6 text-muted"
              >
                Add your reason to ban the user
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="note"
                  id="note"
                  className="block w-full rounded-md border border-hairline bg-inset py-1.5 text-fg shadow-sm placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm sm:leading-6"
                  defaultValue={""}
                />
              </div>
              <button type="submit" className="secondary-button mt-4">
                Ban user
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export default Profile;

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}
