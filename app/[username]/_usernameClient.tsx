"use client";

import React, { useState } from "react";
import Link from "next/link";
import ArticlePreview from "@/components/ArticlePreview/ArticlePreview";
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
        <div className="max-w-2xl px-4 mx-auto text-900 dark:text-white">
          <main className="flex pt-6">
            <div className="mr-4 flex-shrink-0 self-center">
              {image && (
                <img
                  className="rounded-full object-cover h-32 w-32"
                  alt={`Avatar for ${name}`}
                  src={image}
                />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-xl font-bold mb-0">{name}</h1>
              <h2 className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">
                @{username}
              </h2>
              <p className="mt-1">{bio}</p>
              {websiteUrl && !accountLocked && (
                <Link
                  href={websiteUrl}
                  className="flex flex-row items-center"
                  target="blank"
                >
                  <LinkIcon className="h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                  <p className="mt-1 text-blue-500">
                    {getDomainFromUrl(websiteUrl)}
                  </p>
                </Link>
              )}
            </div>
          </main>
          {accountLocked ? (
            <div className="flex items-center justify-between pb-4 mt-8 text-3xl font-extrabold tracking-tight border-b sm:text-4xl text-neutral-900 dark:text-neutral-50">
              <h1>Account locked 🔒</h1>
            </div>
          ) : (
            <div className="mx-auto lg:max-w-5xl sm:max-w-2xl">
              <div className="flex justify-between items-center pt-4">
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
                      <p className="font-medium py-4">
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
                      <p className="font-medium py-4">
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
                      <p className="font-medium py-4">
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
        <div className="border-t-2 text-center pb-8">
          <h4 className="text-2xl mb-6 mt-4">Admin Control</h4>
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
                  className="block w-full rounded-md border-0 py-1.5  shadow-sm ring-1 ring-inset ring-gray-900 dark:ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6"
                  defaultValue={""}
                />
              </div>
              <button type="submit" className="mt-4 secondary-button">
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
