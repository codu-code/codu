"use client";

import * as Sentry from "@sentry/nextjs";
import React from "react";
import Link from "next/link";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
import { LinkIcon } from "@heroicons/react/20/solid";
import { api } from "@/server/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { Tabs } from "@/components/Tabs";
import { toast } from "sonner";

type Props = {
  session: Session | null;
  isOwner: boolean;
  profile: {
    memberships: {
      community: {
        id: string;
        slug: string;
        name: string;
        excerpt: string;
        coverImage: string;
        city: string;
        country: string;
        members: {
          id: string;
        }[];
      };
    }[];
    posts: {
      published: string | null;
      title: string;
      excerpt: string;
      slug: string;
      readTimeMins: number;
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

  const { name, username, image, bio, posts, websiteUrl, id, accountLocked } =
    profile;

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

  const selectedTab =
    tabFromParams && ["groups", "articles"].includes(tabFromParams)
      ? tabFromParams
      : "articles";

  const [ARTICLES, GROUPS] = ["articles", "groups"];
  const tabs = [
    {
      name: `Articles (${posts.length})`,
      value: ARTICLES,
      href: `?tab=${ARTICLES}`,
      current: selectedTab === ARTICLES,
    },
    {
      name: "Groups",
      value: GROUPS,
      href: `?tab=${GROUPS}`,
      current: selectedTab === GROUPS,
    },
  ];

  return (
    <>
      <div className="text-900 mx-auto max-w-2xl px-4 dark:text-white">
        <main className="pt-6 sm:flex">
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
            <h1 className="mb-0 text-lg font-bold md:text-xl">{name}</h1>
            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400">
              @{username}
            </h2>
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
        </main>
        {accountLocked ? (
          <div className="mt-8 flex items-center justify-between border-b pb-4 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
            <h1>Account locked 🔒</h1>
          </div>
        ) : (
          <div className="mx-auto mt-4 sm:max-w-2xl lg:max-w-5xl">
            <Tabs tabs={tabs} />
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
                        readTimeMins,
                        published,
                        id,
                      }) => {
                        if (!published) return;
                        return (
                          <ArticlePreview
                            key={slug}
                            slug={slug}
                            title={title}
                            excerpt={excerpt}
                            name={name}
                            username={username || ""}
                            image={image}
                            date={published}
                            readTime={readTimeMins}
                            menuOptions={
                              isOwner
                                ? [
                                    {
                                      label: "Edit",
                                      href: `/create/${id}`,
                                      postId: id,
                                    },
                                  ]
                                : undefined
                            }
                            showBookmark={!isOwner}
                            id={id}
                          />
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
            case GROUPS:
              return (
                <p className="py-4 font-medium">Groups are coming soon!</p>
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
                  className="block w-full rounded-md border-0 py-1.5  shadow-sm ring-1 ring-inset ring-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-inset dark:ring-gray-300  sm:text-sm sm:leading-6"
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
