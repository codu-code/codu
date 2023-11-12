"use client";

import React, { useState } from "react";
import Link from "next/link";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
import Head from "next/head";
import { LinkIcon } from "@heroicons/react/outline";
import { api } from "@/server/trpc/react";
import { useRouter } from "next/navigation";
import EventPreview from "@/components/EventPreview/EventPreview";
import CommunityPreview from "@/components/CommunityPreview/CommunityPreview";
import type { Session } from "next-auth";
import { Tabs } from "@/components/Tabs";

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
    RSVP: {
      event: {
        id: string;
        slug: string;
        name: string;
        description: string;
        address: string;
        eventDate: Date;
        coverImage: string;
        community: {
          slug: string;
          name: string;
        };
      };
    }[];
    posts: {
      published: string | undefined;
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
  const [selectedTab, setSelectedTab] = useState("articles");

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

  if (!profile) return null; // Should never happen because of serverside fetch or redirect

  const {
    name,
    username,
    image,
    bio,
    posts,
    websiteUrl,
    id,
    accountLocked,
    RSVP,
    memberships,
  } = profile;

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
      console.error(error);
    }
  };

  const tabs = [
    {
      id: "articles",
      title: "Published articles",
      subtitle: `(${posts.length})`,
    },
    {
      id: "events",
      title: "Events",
      subtitle: `(${RSVP.length})`,
    },
    {
      id: "communities",
      title: "Communities",
      subtitle: `(${memberships.length})`,
    },
  ];

  return (
    <>
      <Head>
        <title>{`${name} - Codú`}</title>
        <meta name="description" content={`${name}'s profile on Codú`} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          name="image"
          property="og:image"
          content={`/api/og?title=${encodeURIComponent(
            `${name} - Codú Profile`,
          )}`}
        />
        <meta property="og:type" content="website" />
      </Head>
      <div className="text-900 mx-auto max-w-2xl px-4 dark:text-white">
        <main className="flex pt-6">
          <div className="mr-4 flex-shrink-0 self-center">
            {image && (
              <img
                className="h-32 w-32 rounded-full object-cover"
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
          <div className="mx-auto sm:max-w-2xl lg:max-w-5xl">
            <div className="flex items-center justify-between pt-4">
              <Tabs
                tabs={tabs}
                selectedTab={selectedTab}
                onTabSelected={(tabId) => setSelectedTab(tabId)}
              />
            </div>
          </div>
        )}
        {(() => {
          switch (selectedTab) {
            case "articles":
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
            case "events":
              return (
                <>
                  {RSVP.map(({ event }) => (
                    <EventPreview
                      key={event.name}
                      id={event.id}
                      address={event.address}
                      eventSlug={event.slug}
                      communitySlug={event.community.slug}
                      name={event.name}
                      description={event.description}
                      eventDate={event.eventDate.toISOString()}
                      attendees={RSVP.length}
                      coverImage={event.coverImage}
                      commnunityName={event.community.name}
                    />
                  ))}
                  {memberships.length === 0 ? (
                    <p className="py-4 font-medium">
                      You have not joined an event yet... 🥲
                    </p>
                  ) : null}
                </>
              );
            case "communities":
              return (
                <>
                  {memberships.map(({ community }) => (
                    <CommunityPreview
                      key={community.id}
                      id={community.id}
                      slug={community.slug}
                      name={community.name}
                      excerpt={community.excerpt}
                      image={community.coverImage}
                      city={community.city}
                      country={community.country}
                      membersCount={community.members.length}
                    />
                  ))}
                  {memberships.length === 0 ? (
                    <p className="py-4 font-medium">
                      You have not joined a community yet... 🥲
                    </p>
                  ) : null}
                </>
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
