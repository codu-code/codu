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
      <div className="mx-auto lg:max-w-5xl sm:max-w-2xl">
        <div className="flex justify-between items-center">
          <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onTabSelected={(tabId) => setSelectedTab(tabId)}
          />
          {session && (
            <div>
              <Link
                className="flex-inline items-center bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                href="/communities/create"
              >
                <PlusSmIcon className="h-5 w-5 mr-1 -ml-2 p-0 text-white" />
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
