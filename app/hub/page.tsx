"use client";

import { Tabs } from "@/components/Tabs";
import CommunitiesList from "@/containers/communities";
import EventsList from "@/containers/events";
import Link from "next/link";
import { PlusSmallIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const EventsPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const tabFromParams = searchParams?.get("tab");

  const TAB_VALUES_ARRAY = ["events", "groups"];
  const [EVENTS, GROUPS] = TAB_VALUES_ARRAY;

  const selectedTab =
    tabFromParams && TAB_VALUES_ARRAY.includes(tabFromParams)
      ? tabFromParams
      : EVENTS;

  const tabs = [
    {
      name: `Events`,
      value: EVENTS,
      href: `?tab=${EVENTS}`,
      current: selectedTab === EVENTS,
    },
    {
      name: "Groups",
      value: GROUPS,
      href: `?tab=${GROUPS}`,
      current: selectedTab === GROUPS,
    },
  ];

  return (
    <div className="mx-2">
      <div className="mx-auto sm:max-w-2xl lg:max-w-5xl">
        <div className="flex items-center justify-between">
          <Tabs tabs={tabs} />
          {session && (
            <div>
              <Link
                className="flex-inline inline-flex items-center justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                href="/hub/create"
              >
                <PlusSmallIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                New Community
              </Link>
            </div>
          )}
        </div>
      </div>
      {selectedTab === EVENTS ? <EventsList /> : <CommunitiesList />}
    </div>
  );
};

export default EventsPage;
