import React, { useState } from "react";
import { signIn } from "next-auth/react";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import Head from "next/head";
import prisma from "../../../server/db/client";
import Layout from "../../../components/Layout/Layout";
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
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { PlusSmIcon, PencilIcon } from "@heroicons/react/solid";

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}

const CommunityPage: NextPage = ({
  community,
  host,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [selectedTab, setSelectedTab] = useState("about");
  const { data: session } = useSession();
  const router = useRouter();

  if (!community) return null;

  const { mutate: deleteMembershipMutation } =
    trpc.community.deleteMembership.useMutation({
      onError() {
        toast.error("Something went wrong");
      },
      onSuccess() {
        toast.success("Saved!");
        router.reload();
      },
    });

  const { mutate: createMembershipMutation } =
    trpc.community.createMembership.useMutation({
      onError() {
        toast.error("Something went wrong");
      },
      onSuccess() {
        toast.success("Saved!");
        router.reload();
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
      <Head>
        <title>{community.name}</title>
        <meta key="og:title" property="og:title" content={community.name} />
        <meta
          key="og:description"
          property="og:description"
          content={community.description}
        />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://${host}/communities/${community.slug}`}
        />
        <meta
          name="image"
          property="og:image"
          content={`https://${host}/api/og?title=${encodeURIComponent(
            community.name,
          )}`}
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Layout>
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
          <div className="mx-auto lg:max-w-5xl sm:max-w-2xl">
            <div>
              <div className="mx-auto pb-4 md:max-w-3xl px-2 sm:px-4 break-words">
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
                                    className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                    onClick={() =>
                                      deleteMembership(community.id)
                                    }
                                  >
                                    Leave this community
                                  </button>
                                );
                              } else {
                                return (
                                  <>
                                    <Link
                                      className="mr-2 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                      href={`/communities/${community.slug}/events/create`}
                                    >
                                      <PlusSmIcon className="h-5 w-5 mr-1 -ml-2 p-0 text-white" />
                                      New Event
                                    </Link>
                                    <Link
                                      className="bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                      href={`/communities/${community.slug}/edit`}
                                    >
                                      <PencilIcon className="h-5 w-5 mr-1 -ml-2 p-0 text-white" />
                                      Edit Community
                                    </Link>
                                  </>
                                );
                              }
                            } else {
                              return (
                                <button
                                  className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                  onClick={() => createMembership(community.id)}
                                >
                                  Join this community
                                </button>
                              );
                            }
                          } else {
                            return (
                              <button
                                className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                                onClick={() => signIn()}
                              >
                                Sign in to join this communit
                              </button>
                            );
                          }
                        })()}
                      </div>
                      <div className="text-xs text-neutral-500 mt-2 ml-4">
                        <div className="flex flex-row mb-2">
                          <MapPinIcon className="mr-2" />
                          <p className="font-medium pt-0.5">
                            {community.city}, {community.country}
                          </p>
                        </div>
                      </div>
                    </div>
                    <img
                      className="w-full aspect-[16/9] my-4"
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
                              <p className="font-medium py-4">
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
                              <p className="font-medium py-4">
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
                                  className="p-4 border-l-4 border-l-pink-600 bg-neutral-900"
                                >
                                  <main className="flex">
                                    <div className="mr-4 flex-shrink-0 self-center">
                                      {member.user.image && (
                                        <img
                                          className="rounded-full object-cover h-32 w-32"
                                          alt={`Avatar for ${member.user.name}`}
                                          src={member.user.image}
                                        />
                                      )}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                      <div>
                                        {member.isEventOrganiser && (
                                          <div className="w-fit mb-2 bg-gradient-to-r from-orange-400 to-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded-full text-xs font-bold">
                                            Organizer
                                          </div>
                                        )}
                                      </div>
                                      <Link
                                        className="text-lg md:text-xl font-bold mb-0 hover:underline"
                                        href={`/${member.user.username}`}
                                      >
                                        {member.user.name}
                                      </Link>
                                      <h2 className="text-neutral-400 font-bold text-sm">
                                        @{member.user.username}
                                      </h2>
                                      <p className="mt-1">{member.user.bio}</p>
                                      {member.user.websiteUrl && (
                                        <Link
                                          href={member.user.websiteUrl}
                                          className="flex flex-row items-center"
                                          target="blank"
                                        >
                                          <LinkIcon className="h-5 mr-2 text-neutral-400" />
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
      </Layout>
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ community: string }>,
) => {
  try {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);

    if (!session) {
      return {
        redirect: {
          destination: "/get-started",
          permanent: false,
        },
      };
    }
    const { params } = ctx;

    if (!params?.community) {
      throw new Error("No community");
    }

    const community = await prisma.community.findUnique({
      where: {
        slug: params.community,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        events: {
          include: {
            RSVP: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!community) throw new Error("Event not found");

    return {
      props: {
        community,
        host: ctx.req.headers.host || "",
      },
    };
  } catch {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }
};

export default CommunityPage;
