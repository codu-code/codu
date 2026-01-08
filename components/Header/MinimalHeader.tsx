"use client";

import { api } from "@/server/trpc/react";
import { usePathname } from "next/navigation";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { BellIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { signIn, signOut } from "next-auth/react";
import { PromptLink as Link } from "@/components/PromptService/PromptLink";
import { Fragment } from "react";
import { type Session } from "next-auth";
import Image from "next/image";
import { MobileSearch, Search } from "@/components/ui/Search";
import { useSidebar } from "@/context/SidebarContext";

type AlgoliaConfig = {
  ALGOLIA_APP_ID: string;
  ALGOLIA_SEARCH_API: string;
  ALGOLIA_SOURCE_IDX: string;
};

interface MinimalHeaderProps {
  session: Session | null;
  algoliaSearchConfig: AlgoliaConfig;
  username: string | null;
}

export function MinimalHeader({
  session,
  algoliaSearchConfig,
  username,
}: MinimalHeaderProps) {
  const { data: count } = api.notification.getCount.useQuery(undefined, {
    enabled: session ? true : false,
  });
  const { isCollapsed, toggleSidebar } = useSidebar();

  const pathname = usePathname();

  const userNavigation = [
    {
      name: "Your Profile",
      href: `/${username || "settings"}`,
    },
    {
      name: "Saved posts",
      href: "/saved",
    },
    { name: "Settings", href: "/settings" },
    { name: "Sign out", onClick: () => signOut() },
  ];

  const hasNotifications = !!count && count > 0;

  const handleSignInPageNavigation = () => {
    if (pathname === "/get-started") {
      return;
    }
    signIn();
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {/* Desktop: Burger menu and Logo on the left */}
      <div className="hidden items-center gap-2 lg:flex">
        <button
          onClick={toggleSidebar}
          className="-ml-[10px] rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <Link to="/">
          <Image
            src="/images/codu.png"
            alt="Codú"
            height={16}
            width={64}
            className="dark:invert-0"
          />
        </Link>
      </div>

      {/* Mobile: Logo in center */}
      <div className="flex flex-1 justify-center lg:hidden">
        <Link to="/">
          <Image
            src="/images/codu.png"
            alt="Codú"
            height={14}
            width={56}
            className="dark:invert-0"
          />
        </Link>
      </div>

      {/* Desktop: Search bar - centered */}
      <div className="hidden flex-1 justify-center lg:flex">
        <div className="w-full max-w-md">
          <Search algoliaSearchConfig={algoliaSearchConfig} />
        </div>
      </div>

      {/* Mobile: Search icon */}
      <div className="lg:hidden">
        <MobileSearch algoliaSearchConfig={algoliaSearchConfig} />
      </div>

      <div className="flex items-center gap-2">
        {session ? (
          <>
            {/* Create button - desktop only */}
            <Link
              className="hidden items-center gap-1 rounded-md bg-pink-500 px-2.5 py-1 text-sm font-medium text-white hover:bg-pink-600 lg:flex"
              to="/create"
            >
              <PlusIcon className="h-4 w-4" />
              Create
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="focus-style relative flex-shrink-0 rounded-md p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
            >
              <span className="sr-only">View notifications</span>
              {hasNotifications && (
                <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-pink-600" />
              )}
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </Link>

            {/* User menu */}
            <Menu as="div" className="relative">
              <MenuButton className="flex rounded-full bg-black text-sm ring-offset-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-zinc-900">
                <span className="sr-only">Open user menu</span>
                {session.user?.image ? (
                  <img
                    className="h-7 w-7 rounded-full bg-neutral-300 object-cover lg:h-8 lg:w-8"
                    src={session.user.image}
                    alt={`${session.user?.name}'s avatar`}
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm text-white lg:h-8 lg:w-8">
                    {session.user?.name?.[0] || "C"}
                  </div>
                )}
              </MenuButton>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-zinc-800 dark:ring-white/10">
                  {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                      {item.onClick ? (
                        <button
                          className="flex w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-zinc-700"
                          onClick={item.onClick}
                        >
                          {item.name}
                        </button>
                      ) : (
                        <Link
                          className="block rounded px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-zinc-700"
                          to={item.href || ""}
                        >
                          {item.name}
                        </Link>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Transition>
            </Menu>
          </>
        ) : (
          <>
            <button
              className="nav-button hidden text-sm lg:block"
              onClick={handleSignInPageNavigation}
            >
              Sign in
            </button>
            <button
              className="primary-button text-sm"
              onClick={handleSignInPageNavigation}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );
}
