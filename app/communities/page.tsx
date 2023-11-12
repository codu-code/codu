"use client";
import { useState } from "react";
import { Tabs } from "@/components/Tabs";
import CommunitiesList from "@/containers/communities";
import EventsList from "@/containers/events";
import Link from "next/link";
import { PlusSmIcon } from "@heroicons/react/solid";
import { useSession } from "next-auth/react";

const EventsPage = () => {
  const { data: session } = useSession();
  const tabs = [
    {
      id: "events",
      title: "Events",
    },
    {
      id: "communities",
      title: "Communities",
    },
  ];

  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  return (
    <div className="mx-2">
      <div className="mx-auto sm:max-w-2xl lg:max-w-5xl">
        <div className="flex items-center justify-between">
          <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onTabSelected={(tabId) => setSelectedTab(tabId)}
          />
          {session && (
            <div>
              <Link
                className="flex-inline inline-flex items-center justify-center rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-4 py-2 font-medium text-white shadow-sm hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                href="/communities/create"
              >
                <PlusSmIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                New Community
              </Link>
            </div>
          )}
        </div>
      </div>
      {selectedTab === "events" ? <EventsList /> : <CommunitiesList />}
    </div>
  );
};

export default EventsPage;
