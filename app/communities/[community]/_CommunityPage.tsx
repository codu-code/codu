"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { MapPinIcon } from "lucide-react";
import Link from "next/link";
import { Tabs } from "@/components/Tabs";
import { LinkIcon } from "lucide-react";
import EventPreview from "@/components/EventPreview/EventPreview";
import { useSession } from "next-auth/react";
import Markdoc from "@markdoc/markdoc";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { trpc } from "@/utils/trpc";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PlusSmIcon, PencilIcon } from "@heroicons/react/solid";
import type { Prisma } from "@prisma/client";

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}

type Community = Prisma.CommunityGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    events: {
      include: {
        RSVP: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

interface CommunityPageProps {
  community: Community;
}

function CommunityPage(props: CommunityPageProps) {
  const { community } = props;
  const [selectedTab, setSelectedTab] = useState("about");
  const { data: session } = useSession();
  const { refresh, push } = useRouter();

  if (!community) {
    push("/not-found");
  }

  const { mutate: deleteMembershipMutation } =
    trpc.community.deleteMembership.useMutation({
      onError() {
        toast.error("Something went wrong");
      },
      onSuccess() {
        toast.success("Saved!");
        refresh();
      },
    });

  const { mutate: createMembershipMutation } =
    trpc.community.createMembership.useMutation({
      onError() {
        toast.error("Something went wrong");
      },
      onSuccess() {
        toast.success("Saved!");
        refresh();
      },
    });

  async function createMembership(communityId: string) {
    createMembershipMutation({ id: communityId });
  }

  async function deleteMembership(communityId: string) {
    deleteMembershipMutation({ id: communityId });
  }

  const ast = Markdoc.parse(community.description);
  const content = Markdoc.transform(ast, config);

  const now = new Date().getTime();

  const tabs = [
    {
      id: "about",
      title: "About",
    },
    {
      id: "upcoming-events",
      title: "Upcoming events",
      subtitle: `(${
        community.events.filter((e) => e.eventDate.getTime() - now > 0).length
      })`,
    },
    {
      id: "past-events",
      title: "Past events",
      subtitle: `(${
        community.events.filter((e) => e.eventDate.getTime() - now < 0).length
      })`,
    },
    {
      id: "members",
      title: "Members",
      subtitle: `(${community.members.length})`,
    },
  ];

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            borderRadius: 0,
            border: "2px solid black",
            background: "white",
          },
        }}
      />
      <div className="mx-auto sm:max-w-2xl lg:max-w-5xl">
        <div>
          <div className="mx-auto break-words px-2 pb-4 sm:px-4 md:max-w-3xl">
            <article className="mx-auto max-w-3xl pt-12">
              <div>
                <h1 className="text-4xl font-bold">{community.name}</h1>
                <p className="my-3">{community.excerpt}</p>
                <div className="flex flex-row">
                  <div>
                    {(() => {
                      if (session) {
                        const membership = community.members.find(
                          (m) => m.userId === session.user?.id,
                        );
                        if (membership) {
                          // Organisers cannoy leave their own community
                          // TODO support this after there is support for multiple organisers
                          if (!membership.isEventOrganiser) {
                            return (
                              <button
                                className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                                onClick={() => deleteMembership(community.id)}
                              >
                                Leave this community
                              </button>
                            );
                          } else {
                            return (
                              <>
                                <Link
                                  className="mr-2 inline-flex justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                                  href={`/communities/${community.slug}/events/create`}
                                >
                                  <PlusSmIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                                  New Event
                                </Link>
                                <Link
                                  className="inline-flex justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                                  href={`/communities/${community.slug}/edit`}
                                >
                                  <PencilIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                                  Edit Community
                                </Link>
                              </>
                            );
                          }
                        } else {
                          return (
                            <button
                              className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                              onClick={() => createMembership(community.id)}
                            >
                              Join this community
                            </button>
                          );
                        }
                      } else {
                        return (
                          <button
                            className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                            onClick={() => signIn()}
                          >
                            Sign in to join this community
                          </button>
                        );
                      }
                    })()}
                  </div>
                  <div className="ml-4 mt-2 text-xs text-neutral-500">
                    <div className="mb-2 flex flex-row">
                      <MapPinIcon className="mr-2" />
                      <p className="pt-0.5 font-medium">
                        {community.city}, {community.country}
                      </p>
                    </div>
                  </div>
                </div>
                <img
                  className="my-4 aspect-[16/9] w-full"
                  src={community.coverImage}
                  alt={community.name}
                />
              </div>
              <Tabs
                tabs={tabs}
                selectedTab={selectedTab}
                onTabSelected={(tabId) => setSelectedTab(tabId)}
              />
              {(() => {
                switch (selectedTab) {
                  case "about":
                    return (
                      <div className="prose prose-invert mt-0">
                        {Markdoc.renderers.react(content, React, {
                          components: markdocComponents,
                        })}
                      </div>
                    );
                  case "upcoming-events":
                    return (
                      <div>
                        {community.events
                          .filter((e) => e.eventDate.getTime() - now > 0)
                          .sort(
                            (a, b) =>
                              a.eventDate.getTime() - b.eventDate.getTime(),
                          )
                          .map((event) => (
                            <EventPreview
                              key={event.name}
                              id={event.id}
                              address={event.address}
                              eventSlug={event.slug}
                              communitySlug={community.slug}
                              name={event.name}
                              description={event.description}
                              eventDate={event.eventDate.toISOString()}
                              attendees={event.RSVP.length}
                              coverImage={event.coverImage}
                              commnunityName={community.name}
                            />
                          ))}
                        {community.events.filter(
                          (e) => e.eventDate.getTime() - now > 0,
                        ).length === 0 ? (
                          <p className="py-4 font-medium">
                            There are no events yet... 🥲
                          </p>
                        ) : null}
                      </div>
                    );
                  case "past-events":
                    return (
                      <div>
                        {community.events
                          .filter((e) => e.eventDate.getTime() - now < 0)
                          .sort(
                            (a, b) =>
                              b.eventDate.getTime() - a.eventDate.getTime(),
                          )
                          .map((event) => (
                            <EventPreview
                              key={event.name}
                              id={event.id}
                              address={event.address}
                              eventSlug={event.slug}
                              communitySlug={community.slug}
                              name={event.name}
                              description={event.description}
                              eventDate={event.eventDate.toISOString()}
                              attendees={event.RSVP.length}
                              coverImage={event.coverImage}
                              commnunityName={community.name}
                            />
                          ))}
                        {community.events.filter(
                          (e) => e.eventDate.getTime() - now < 0,
                        ).length === 0 ? (
                          <p className="py-4 font-medium">
                            There are no events yet... 🥲
                          </p>
                        ) : null}
                      </div>
                    );
                  case "members":
                    return (
                      <div className="grid grid-cols-1 gap-4">
                        {community.members
                          .sort(
                            (a, b) =>
                              b.createdAt.getTime() - a.createdAt.getTime(),
                          )
                          .sort((a) => (a.isEventOrganiser ? -1 : 1))
                          .map((member) => (
                            <div
                              key={member.id}
                              className="border-l-4 border-l-pink-600 bg-neutral-900 p-4"
                            >
                              <main className="flex">
                                <div className="mr-4 flex-shrink-0 self-center">
                                  {member.user.image && (
                                    <img
                                      className="h-32 w-32 rounded-full object-cover"
                                      alt={`Avatar for ${member.user.name}`}
                                      src={member.user.image}
                                    />
                                  )}
                                </div>
                                <div className="flex flex-col justify-center">
                                  <div>
                                    {member.isEventOrganiser && (
                                      <div className="mb-2 w-fit rounded-full bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700">
                                        Organizer
                                      </div>
                                    )}
                                  </div>
                                  <Link
                                    className="mb-0 text-lg font-bold hover:underline md:text-xl"
                                    href={`/${member.user.username}`}
                                  >
                                    {member.user.name}
                                  </Link>
                                  <h2 className="text-sm font-bold text-neutral-400">
                                    @{member.user.username}
                                  </h2>
                                  <p className="mt-1">{member.user.bio}</p>
                                  {member.user.websiteUrl && (
                                    <Link
                                      href={member.user.websiteUrl}
                                      className="flex flex-row items-center"
                                      target="blank"
                                    >
                                      <LinkIcon className="mr-2 h-5 text-neutral-400" />
                                      <p className="mt-1 text-blue-500">
                                        {getDomainFromUrl(
                                          member.user.websiteUrl,
                                        )}
                                      </p>
                                    </Link>
                                  )}
                                </div>
                              </main>
                            </div>
                          ))}
                      </div>
                    );
                  default:
                    return null;
                }
              })()}
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

export default CommunityPage;
