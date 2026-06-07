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
import { FollowButton } from "@/components/ds";
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

  const { name, username, image, bio, posts, websiteUrl, id, accountLocked } =
    profile;

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

  const ARTICLES = "articles";
  const selectedTab = tabFromParams === ARTICLES ? ARTICLES : ARTICLES;

  return (
    <>
      <div className="text-900 mx-auto max-w-2xl px-4 text-black dark:text-white">
        <div className="pt-6 sm:flex">
          <div className="mr-4 flex-shrink-0 self-center">
            {image && (
              <img
                className="mb-2 h-20 w-20 rounded-full object-cover sm:mb-0 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
                alt={`Avatar for ${name}`}
                src={image}
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="mb-0 text-lg font-bold md:text-xl">{name}</h1>
              {session && !isOwner && !accountLocked && (
                <FollowButton userId={id} />
              )}
            </div>
            <h2 className="text-sm font-bold text-muted">@{username}</h2>
            {!accountLocked && (
              <p className="mt-1 text-sm text-muted">
                <button
                  type="button"
                  onClick={() =>
                    setListView((v) =>
                      v === "followers" ? null : "followers",
                    )
                  }
                  className="transition-colors hover:text-fg"
                >
                  <span className="font-semibold text-fg">
                    {followCounts?.followers ?? 0}
                  </span>{" "}
                  followers
                </button>{" "}
                ·{" "}
                <button
                  type="button"
                  onClick={() =>
                    setListView((v) =>
                      v === "following" ? null : "following",
                    )
                  }
                  className="transition-colors hover:text-fg"
                >
                  <span className="font-semibold text-fg">
                    {followCounts?.following ?? 0}
                  </span>{" "}
                  following
                </button>
              </p>
            )}
            <p className="mt-1">{bio}</p>
            {websiteUrl && !accountLocked && (
              <Link
                href={websiteUrl}
                className="flex flex-row items-center"
                target="blank"
              >
                <LinkIcon className="mr-2 h-5 text-neutral-500 dark:text-neutral-400" />
                <p className="mt-1 text-blue-500">
                  {getDomainFromUrl(websiteUrl)}
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Achievements */}
        {!accountLocked && engagement && (
          <div className="mt-8 rounded-xl border border-hairline bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
              <span className="text-faint">{"// "}</span>achievements
            </p>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <div className="font-display text-2xl font-extrabold text-fg">
                  🔥 {engagement.currentStreak}
                </div>
                <div className="text-xs text-faint">day streak</div>
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-fg">
                  {engagement.longestStreak}
                </div>
                <div className="text-xs text-faint">longest streak</div>
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-fg">
                  {engagement.points}
                </div>
                <div className="text-xs text-faint">points</div>
              </div>
              <div>
                <div className="font-display text-2xl font-extrabold text-fg">
                  {engagement.badges.filter((b) => b.earned).length}/
                  {engagement.badges.length}
                </div>
                <div className="text-xs text-faint">badges</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {engagement.badges.map((b) => (
                <div
                  key={b.key}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    b.earned
                      ? "border-accent/40 bg-accent/5"
                      : "border-hairline opacity-50"
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {b.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-fg">
                      {b.name}{" "}
                      {!b.earned && (
                        <span className="font-mono text-[10px] text-faint">
                          locked
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {b.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="mt-8 flex items-center justify-between border-b pb-4 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
            <Heading level={1}>Account locked 🔒</Heading>
          </div>
        ) : (
          <div className="mx-auto mt-4 sm:max-w-2xl lg:max-w-5xl">
            <Heading level={1}>{`Articles (${posts.length})`}</Heading>
          </div>
        )}
        {(() => {
          switch (selectedTab) {
            case ARTICLES:
              return (
                <div>
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
                                className="absolute right-2 top-2 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        );
                      },
                    )
                  ) : (
                    <p className="py-4 font-medium">
                      Nothing published yet... 🥲
                    </p>
                  )}
                </div>
              );
            default:
              return null;
          }
        })()}
      </div>
      {session?.user?.role === "ADMIN" && (
        <div className="border-t-2 pb-8 text-center">
          <h4 className="mb-6 mt-4 text-2xl">Admin Control</h4>
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
                className="block text-sm font-medium leading-6 text-gray-700 dark:text-gray-400"
              >
                Add your reason to ban the user
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="note"
                  id="note"
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-inset dark:ring-gray-300 sm:text-sm sm:leading-6"
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
