"use client";
import React, { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Temporal } from "@js-temporal/polyfill";
import { CalendarIcon, LinkIcon, MapPinIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Tabs } from "@/components/Tabs";
import { useSession } from "next-auth/react";
import Markdoc from "@markdoc/markdoc";
import { markdocComponents } from "@/markdoc/components";
import { config } from "@/markdoc/config";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { PencilIcon } from "@heroicons/react/solid";
import type { Prisma } from "@prisma/client";

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}

type Event = Prisma.EventGetPayload<{
  include: {
    RSVP: {
      include: {
        user: true;
      };
    };
    community: {
      select: {
        excerpt: true;
        slug: true;
        name: true;
        city: true;
        country: true;
        coverImage: true;
        members: {
          select: {
            id: true;
            isEventOrganiser: true;
            userId: true;
          };
        };
      };
    };
  };
}>;

interface EventPageProps {
  event: Event;
}

function EventPage(props: EventPageProps) {
  const { event } = props;
  const [eventDate, setEventDate] = useState("");
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

  const searchParams = useSearchParams();

  const tabFromParams = searchParams?.get("tab");
  const TAB_VALUES_ARRAY = ["about", "attendees", "waiting"];
  const [ABOUT, ATTENDEES, WAITING] = TAB_VALUES_ARRAY;

  const selectedTab =
    tabFromParams && TAB_VALUES_ARRAY.includes(tabFromParams)
      ? tabFromParams
      : ABOUT;

  const tabs = [
    {
      name: `About`,
      value: ABOUT,
      href: `?tab=${ABOUT}`,
      current: selectedTab === ABOUT,
    },
    {
      name: "Attendees",
      value: ATTENDEES,
      href: `?tab=${ATTENDEES}`,
      current: selectedTab === ATTENDEES,
    },
    {
      name: "Waiting",
      value: WAITING,
      href: `?tab=${WAITING}`,
      current: selectedTab === WAITING,
    },
  ];

  if (!event) return notFound();

  const { mutate: deleteRsvpMutation } = trpc.event.deleteRSVP.useMutation({
    onError() {
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Saved!");
      router.refresh();
    },
  });

  const { mutate: createRsvpMutation } = trpc.event.createRSVP.useMutation({
    onError() {
      toast.error("Something went wrong");
    },
    onSuccess() {
      toast.success("Saved!");
      router.refresh();
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

  const organisers = event.community.members
    .filter((m) => m.isEventOrganiser)
    .map((m) => m.userId);

  const renderList = (filter: (i: number) => boolean) => {
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
                className="border-l-4 border-l-pink-600 bg-neutral-900 p-4"
              >
                <main className="flex">
                  <div className="mr-4 flex-shrink-0 self-center">
                    {rsvp.user.image && (
                      <img
                        className="h-32 w-32 rounded-full object-cover"
                        alt={`Avatar for ${rsvp.user.name}`}
                        src={rsvp.user.image}
                      />
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <div>
                      {organisers.includes(rsvp.user.id) && (
                        <div className="mb-2 w-fit rounded-full bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700">
                          Organizer
                        </div>
                      )}
                    </div>
                    <Link
                      className="mb-0 text-lg font-bold hover:underline md:text-xl"
                      href={`/${rsvp.user.username}`}
                    >
                      {rsvp.user.name}
                    </Link>
                    <h2 className="text-sm font-bold text-neutral-400">
                      @{rsvp.user.username}
                    </h2>
                    <p className="mt-1">{rsvp.user.bio}</p>
                    {rsvp.user.websiteUrl && (
                      <Link
                        href={rsvp.user.websiteUrl}
                        className="flex flex-row items-center"
                        target="blank"
                      >
                        <LinkIcon className="mr-2 h-5 text-neutral-400" />
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
          <p className="py-4 font-medium">There are no attendees yet... 🥲</p>
        ) : null}
      </>
    );
  };

  return (
    <>
      <div className="mx-auto grid-cols-12 gap-8 sm:max-w-2xl lg:grid lg:max-w-5xl">
        <div className="relative md:col-span-8">
          <div className="mx-auto break-words px-2 pb-4 sm:px-4 md:max-w-3xl">
            <article className="mx-auto max-w-3xl pt-10">
              <div className="flex items-center justify-between">
                <h1 className="mb-4 text-3xl font-bold">{event.name}</h1>
                <div>
                  {session &&
                    session.user &&
                    organisers.includes(session.user.id) && (
                      <Link
                        className="flex-inline inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                        href={`/hub/${event.community.slug}/events/${event.slug}/edit`}
                      >
                        <PencilIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                        Edit Event
                      </Link>
                    )}
                </div>
              </div>
              <div>
                <img
                  className="mb-4 aspect-[16/9] w-full"
                  src={event.coverImage}
                  alt={event.name}
                />
              </div>
              <Tabs tabs={tabs} />
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
                    return <>{renderList((index) => index > event.capacity)}</>;
                  default:
                    return null;
                }
              })()}
            </article>
          </div>
        </div>
        <div className="col-span-4">
          <div className="mb-8 mt-12 border border-neutral-600 bg-neutral-900">
            <img
              className="aspect-[16/9] w-full"
              src={event.community.coverImage}
              alt={event.community.name}
            />
            <div className="my-3 break-words px-4 py-2 text-sm tracking-wide">
              <Link
                className="block text-lg font-semibold leading-6 hover:underline"
                href={`/hub/${event.community.slug}`}
              >
                {event.community.name}
              </Link>
              <p className="my-2">{event.community.excerpt}</p>
              <div className="mt-4 text-xs text-neutral-500">
                <div className="mb-4 flex flex-row text-neutral-500">
                  <div>
                    <CalendarIcon className="mr-2" />
                  </div>
                  <div>
                    <p>{eventDate}</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-row text-neutral-500">
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
                <div className="mb-4 flex flex-row">
                  <UsersIcon className="mr-2" />
                  <p className="pt-0.5 font-medium">
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
                          className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                          onClick={() => deleteRsvp(event.id)}
                        >
                          Cancel your attendance to this event
                        </button>
                      );
                    }
                  } else {
                    return (
                      <button
                        className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
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
                      className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
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
  );
}

export default EventPage;
