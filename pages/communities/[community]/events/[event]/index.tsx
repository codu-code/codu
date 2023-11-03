import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import Head from "next/head";
import prisma from "../../../../../server/db/client";
import Layout from "../../../../../components/Layout/Layout";
import { Temporal } from "@js-temporal/polyfill";
import { CalendarIcon, LinkIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Tabs } from "@/components/Tabs";
import { useSession } from "next-auth/react";
import Markdoc from "@markdoc/markdoc";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { trpc } from "@/utils/trpc";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/router";
import { PencilIcon } from "@heroicons/react/solid";

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}

const EventPage: NextPage = ({
  event,
  host,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [eventDate, setEventDate] = useState("");
  const [selectedTab, setSelectedTab] = useState("about");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (event) {
      const dateTime = Temporal.Instant.from(event.eventDate.toISOString());
      const readableDate = dateTime.toLocaleString(["en-IE"], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      setEventDate(readableDate);
    }
  }, [event]);

  if (!event) return null;

  const { mutate: deleteRsvpMutation } = trpc.event.deleteRSVP.useMutation({
    onError() {
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Saved!");
      router.reload();
    },
  });

  const { mutate: createRsvpMutation } = trpc.event.createRSVP.useMutation({
    onError() {
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Saved!");
      router.reload();
    },
  });

  async function createRsvp(communityId: string) {
    createRsvpMutation({ id: communityId });
  }

  async function deleteRsvp(communityId: string) {
    deleteRsvpMutation({ id: communityId });
  }

  const ast = Markdoc.parse(event.description);
  const content = Markdoc.transform(ast, config);

  const tabs = [
    {
      id: "about",
      title: "About",
    },
    {
      id: "attendees",
      title: "Attendees",
      subtitle: `(${
        event.RSVP.length <= event.capacity ? event.RSVP.length : event.capacity
      })`,
    },
    {
      id: "waiting-list",
      title: "Waiting List",
      subtitle: `(${
        event.RSVP.length > event.capacity
          ? event.RSVP.length - event.capacity
          : 0
      })`,
    },
  ];

  const organisers = event.community.members
    .filter((m) => m.isEventOrganiser)
    .map((m) => m.userId);

  const renderList = (filter: (index: number) => boolean) => {
    const list = event.RSVP.filter((_e, i) => filter(i));
    return (
      <>
        <div className="grid grid-cols-1 gap-4">
          {list
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .sort((rsvp) => (organisers.includes(rsvp.user.id) ? -1 : 1))
            .map((rsvp) => (
              <div
                key={rsvp.id}
                className="bg-neutral-900 p-4 border-l-4 border-l-pink-600"
              >
                <main className="flex">
                  <div className="mr-4 flex-shrink-0 self-center">
                    {rsvp.user.image && (
                      <img
                        className="rounded-full object-cover h-32 w-32"
                        alt={`Avatar for ${rsvp.user.name}`}
                        src={rsvp.user.image}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <div>
                      {organisers.includes(rsvp.user.id) && (
                        <div className="w-fit mb-2 bg-gradient-to-r from-orange-400 to-pink-600 hover:bg-pink-700 text-white py-1 px-3 rounded-full text-xs font-bold">
                          Organizer
                        </div>
                      )}
                    </div>
                    <Link
                      className="text-lg md:text-xl font-bold mb-0 hover:underline"
                      href={`/${rsvp.user.username}`}
                    >
                      {rsvp.user.name}
                    </Link>
                    <h2 className="text-neutral-400 font-bold text-sm">
                      @{rsvp.user.username}
                    </h2>
                    <p className="mt-1">{rsvp.user.bio}</p>
                    {rsvp.user.websiteUrl && (
                      <Link
                        href={rsvp.user.websiteUrl}
                        className="flex flex-row items-center"
                        target="blank"
                      >
                        <LinkIcon className="h-5 mr-2 text-neutral-400" />
                        <p className="mt-1 text-blue-500">
                          {getDomainFromUrl(rsvp.user.websiteUrl)}
                        </p>
                      </Link>
                    )}
                  </div>
                </main>
              </div>
            ))}
        </div>
        {list.length === 0 ? (
          <p className="font-medium py-4">There are no attendees yet... 🥲</p>
        ) : null}
      </>
    );
  };

  return (
    <>
      <Head>
        <title>{event.name}</title>
        <meta key="og:title" property="og:title" content={event.name} />
        <meta
          key="og:description"
          property="og:description"
          content={event.description}
        />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://${host}/articles/${event.slug}`}
        />
        <meta
          name="image"
          property="og:image"
          content={`https://${host}/api/og?title=${encodeURIComponent(
            event.name,
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
          <div className="lg:grid grid-cols-12 gap-8 mx-auto lg:max-w-5xl sm:max-w-2xl">
            <div className="relative md:col-span-8">
              <div className="mx-auto pb-4 md:max-w-3xl px-2 sm:px-4 break-words">
                <article className="mx-auto max-w-3xl pt-10">
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
                    <div>
                      {session &&
                        session.user &&
                        organisers.includes(session.user.id) && (
                          <Link
                            className="whitespace-nowrap flex-inline items-center bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            href={`/communities/${event.community.slug}/events/${event.slug}/edit`}
                          >
                            <PencilIcon className="h-5 w-5 mr-1 -ml-2 p-0 text-white" />
                            Edit Event
                          </Link>
                        )}
                    </div>
                  </div>
                  <div>
                    <img
                      className="w-full aspect-[16/9] mb-4"
                      src={event.coverImage}
                      alt={event.name}
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
                      case "attendees":
                        return (
                          <>{renderList((index) => index <= event.capacity)}</>
                        );
                      case "waiting-list":
                        return (
                          <>{renderList((index) => index > event.capacity)}</>
                        );
                      default:
                        return null;
                    }
                  })()}
                </article>
              </div>
            </div>
            <div className="col-span-4">
              <div className="mt-12 mb-8 border border-neutral-600 bg-neutral-900">
                <img
                  className="w-full aspect-[16/9]"
                  src={event.community.coverImage}
                  alt={event.community.name}
                />
                <div className="tracking-wide text-sm my-3 break-words px-4 py-2">
                  <Link
                    className="block text-lg leading-6 font-semibold hover:underline"
                    href={`/communities/${event.community.slug}`}
                  >
                    {event.community.name}
                  </Link>
                  <p className="my-2">{event.community.excerpt}</p>
                  <div className="text-xs text-neutral-500 mt-4">
                    <div className="flex flex-row mb-4 text-neutral-500">
                      <div>
                        <CalendarIcon className="mr-2" />
                      </div>
                      <div>
                        <p>{eventDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-row mb-4 text-neutral-500">
                      <div>
                        <MapPinIcon className="mr-2" />
                      </div>
                      <div>
                        <p>
                          {event.address}, {event.community.city},{" "}
                          {event.community.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row mb-4">
                      <UsersIcon className="mr-2" />
                      <p className="font-medium pt-0.5">
                        {event.capacity - event.RSVP.length > 0
                          ? event.capacity - event.RSVP.length
                          : 0}{" "}
                        spots left
                      </p>
                    </div>
                  </div>
                  {(() => {
                    if (session) {
                      const rsvp = event.RSVP.find(
                        (rsvp) => rsvp.user.id === session.user?.id,
                      );
                      if (rsvp !== undefined) {
                        const isEventOrganiser = event.community.members.some(
                          (m) =>
                            m.userId === session.user?.id && m.isEventOrganiser,
                        );
                        // Organisers cannoy leave their own events
                        // TODO support this after there is support for multiple organisers
                        if (!isEventOrganiser) {
                          return (
                            <button
                              className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                              onClick={() => deleteRsvp(event.id)}
                            >
                              Cancel your attendance to this event
                            </button>
                          );
                        }
                      } else {
                        return (
                          <button
                            className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            onClick={() => createRsvp(event.id)}
                          >
                            {event.capacity - event.RSVP.length <= 0
                              ? "Join the waiting list"
                              : "Attend this event"}
                          </button>
                        );
                      }
                    } else {
                      return (
                        <button
                          className="w-full bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                          onClick={() => signIn()}
                        >
                          Sign in to attend this event
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      </Layout>
    </>
  );
};

export const getServerSideProps = async (
  ctx: GetServerSidePropsContext<{ event: string }>,
) => {
  try {
    const { params } = ctx;

    if (!params?.event) {
      throw new Error("No event");
    }

    const event = await prisma.event.findUnique({
      where: {
        slug: params.event,
      },
      include: {
        RSVP: {
          include: {
            user: true,
          },
        },
        community: {
          select: {
            excerpt: true,
            slug: true,
            name: true,
            city: true,
            country: true,
            coverImage: true,
            members: {
              select: {
                id: true,
                isEventOrganiser: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!event) throw new Error("Event not found");

    return {
      props: {
        event,
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

export default EventPage;
