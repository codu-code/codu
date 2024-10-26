"use client";
import { api } from "@/server/trpc/react";
import { usePathname } from "next/navigation";
import {
  Disclosure,
  DisclosureButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { BellIcon, PlusIcon } from "@heroicons/react/20/solid";
import { signIn, signOut } from "next-auth/react";
import { PromptLink as Link } from "../PromptService/PromptLink";
import { Fragment } from "react";
import { navigation } from "../../config/site_settings";
import { type Session } from "next-auth";
import ThemeToggle from "../Theme/ThemeToggle/ThemeToggle";
import AnimatedHamburger from "./AnimatedHamburger";
import Logo from "@/icons/logo.svg";
import MobileNav from "./MobileNav";
import { MobileSearch, Search } from "@/components/ui/Search";

type AlgoliaConfig = {
  ALGOLIA_APP_ID: string;
  ALGOLIA_SEARCH_API: string;
  ALGOLIA_SOURCE_IDX: string;
};

const Nav = ({
  session,
  algoliaSearchConfig,
  username,
}: {
  session: Session | null;
  algoliaSearchConfig: AlgoliaConfig;
  username: string | null;
}) => {
  const { data: count } = api.notification.getCount.useQuery(undefined, {
    enabled: session ? true : false,
  });

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
    /**
     * * NextAuth.js automatically adds current url to the callbackurl prop in the singin() method.
     * * As Navbar is always present, spamming SignIn button causes login page url getting appended in the url bar.
     */
    if (pathname === "/get-started") {
      return;
    }

    signIn();
  };

  return (
    <Disclosure as="nav" className="bg-neutral-100 dark:bg-black">
      {({ close, open }) => (
        <>
          <div className="relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="sr-only">Codú</span>
                  <Link
                    className="-ml-2 flex w-auto items-baseline p-2 text-neutral-800 transition-colors ease-in-out hover:text-neutral-600 focus:text-neutral-600 dark:text-neutral-50 dark:hover:text-neutral-300 focus:dark:text-neutral-300"
                    to="/"
                  >
                    <Logo className="h-5 lg:h-6" />
                    <span className="ml-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Beta
                    </span>
                  </Link>
                </div>
                <div className="ml-4 hidden text-sm font-medium md:block lg:text-base">
                  <div className="flex space-x-2">
                    {navigation.map((item) =>
                      item.href.includes("http") ? (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nav-button focus-style p-4"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link
                          className="nav-button"
                          key={item.name}
                          to={item.href}
                        >
                          {item.name}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <Search algoliaSearchConfig={algoliaSearchConfig} />

              <div className="ml-4 hidden md:block">
                <div className="flex items-center space-x-2 text-sm font-medium lg:text-base">
                  {session ? (
                    <>
                      <Link className="nav-button" to="/my-posts">
                        Your Posts
                      </Link>

                      <Link className="primary-button px-4" to="/create">
                        <PlusIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                        New Post
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        className="nav-button"
                        onClick={handleSignInPageNavigation}
                      >
                        Sign in
                      </button>
                      <button
                        className="primary-button"
                        onClick={handleSignInPageNavigation}
                      >
                        Sign up for free
                      </button>
                    </>
                  )}

                  <div className="ml-3">
                    <ThemeToggle />
                  </div>

                  {session && (
                    <>
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
                      <Menu as="div" className="relative ml-4">
                        <div>
                          <MenuButton className="flex rounded-full bg-black text-sm ring-offset-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 focus:ring-offset-white">
                            <span className="sr-only">Open user menu</span>
                            {session.user?.image ? (
                              <img
                                className="h-10 w-10 rounded-full bg-neutral-300 object-cover"
                                src={session?.user?.image}
                                alt={`${session.user?.name}'s avatar`}
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
                                {session.user?.name?.[0] || "C"}
                              </div>
                            )}
                          </MenuButton>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <MenuItem key={item.name}>
                                {item.onClick ? (
                                  <button
                                    className={
                                      "flex w-full rounded px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200"
                                    }
                                    onClick={item.onClick}
                                  >
                                    {item.name}
                                  </button>
                                ) : (
                                  <Link
                                    className="block rounded px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200"
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
                  )}
                </div>
              </div>
              <div className="-mr-2 flex items-center md:hidden">
                <MobileSearch algoliaSearchConfig={algoliaSearchConfig} />
                <ThemeToggle />
                {session && (
                  <Link
                    to="/notifications"
                    className="focus-style relative flex-shrink-0 rounded-md p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                  >
                    <span className="sr-only">View notifications</span>
                    {hasNotifications && (
                      <div className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-pink-500" />
                    )}
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                )}
                {/* Mobile menu button */}
                <DisclosureButton className="nav-button focus-style group">
                  <span className="sr-only">Open main menu</span>
                  <AnimatedHamburger open={open} />
                </DisclosureButton>
              </div>
            </div>
          </div>
          <MobileNav
            session={session}
            userNavigation={userNavigation}
            close={close}
          />
        </>
      )}
    </Disclosure>
  );
};

export default Nav;
