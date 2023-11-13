"use client";
import { api } from "@/server/trpc/react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { BellIcon, PlusSmIcon } from "@heroicons/react/solid";
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { navigation } from "../../config/site_settings";
import { type Session } from "next-auth";
import ThemeToggle from "../Theme/ThemeToggle";
import AnimatedHamburger from "./AnimatedHamburger";

import MobileNav from "./MobileNav";

const Nav = ({ session }: { session: Session | null }) => {
  const { data: count } = api.notification.getCount.useQuery(undefined, {
    enabled: session ? true : false,
  });

  const userNavigation = [
    {
      name: "Your Profile",
      href: `/${(session && session.user?.username) || "settings"}`,
    },
    {
      name: "Saved posts",
      href: "/saved",
    },
    { name: "Settings", href: "/settings" },
    { name: "Sign out", onClick: () => signOut() },
  ];

  const hasNotifications = !!count && count > 0;

  return (
    <Disclosure as="nav" className="bg-neutral-100 dark:bg-black">
      {({ open }) => (
        <>
          <div className="relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="sr-only">Codú</span>
                  <Link
                    className="logo-focus hidden h-8 w-auto items-baseline lg:flex"
                    href="/"
                  >
                    <Image
                      src="/images/codu.png"
                      alt="Codú logo"
                      className="invert dark:invert-0"
                      height={30}
                      width={94.5}
                      priority
                      sizes="(max-width: 94px) 100vw"
                    />
                    <span className="ml-2 text-xs font-semibold">Beta</span>
                  </Link>
                  <div className="flex">
                    <Link
                      className="flex w-auto items-end p-2 lg:hidden"
                      href="/"
                    >
                      <span className="sr-only">Codú</span>
                      <svg className="h-8" viewBox="0 0 694 829" fill="none">
                        <path
                          className="fill-black dark:fill-white"
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M674.287 736.808C600.91 796.992 508.826 829.601 413.972 828.992C299.426 828.992 201.794 788.584 121.077 707.77C40.3589 626.955 0 529.206 0 414.523C0 300.208 40.3589 202.624 121.077 121.773C201.794 40.9216 299.426 0.330605 413.972 0C512.007 0 600.504 32.3074 679.46 96.9223C684.376 101.861 688.203 107.777 690.696 114.287C693.189 120.797 694.292 127.758 693.934 134.722C694.032 142.18 692.628 149.582 689.807 156.486C687.101 162.973 683.157 168.869 678.194 173.843C673.163 178.876 667.174 182.848 660.583 185.524C650.668 189.611 639.776 190.709 629.246 188.682C618.716 186.656 609.006 181.594 601.311 174.119C575.29 153.479 545.988 137.367 514.631 126.456C482.257 115.271 448.218 109.682 413.972 109.926C373.998 109.875 334.407 117.721 297.466 133.013C260.526 148.305 226.961 170.744 198.695 199.043C170.429 227.343 148.018 260.948 132.744 297.933C117.47 334.918 109.634 374.557 109.684 414.578C109.684 499.066 139.183 570.918 198.18 630.133C251.394 683.086 322.202 714.596 397.119 718.66C472.037 722.724 545.831 699.06 604.448 652.173C613.944 645.823 625.113 642.447 636.533 642.475C643.828 642.424 651.05 643.927 657.721 646.883C664.132 649.742 669.998 653.694 675.057 658.565C680.128 663.517 684.185 669.413 687 675.922C689.92 682.706 691.4 690.024 691.348 697.411C691.282 704.787 689.739 712.074 686.808 718.842C683.878 725.609 679.62 731.719 674.287 736.808Z"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className="hidden text-sm font-medium md:ml-6 md:block lg:text-base">
                  <div className="flex space-x-4">
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
                          href={item.href}
                        >
                          {item.name}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden md:ml-6 md:block">
                <div className="flex items-center text-sm font-medium lg:text-base">
                  {session ? (
                    <>
                      <Link className="nav-button" href="/my-posts">
                        Your Posts
                      </Link>

                      <Link className="primary-button ml-4 px-4" href="/create">
                        <PlusSmIcon className="-ml-2 mr-1 h-5 w-5 p-0 text-white" />
                        New Post
                      </Link>
                    </>
                  ) : (
                    <>
                      <button className="nav-button" onClick={() => signIn()}>
                        Sign in
                      </button>
                      <button
                        className="primary-button"
                        onClick={() => signIn()}
                      >
                        Sign up for free
                      </button>
                    </>
                  )}
                  {/* Profile dropdown */}
                  <div className="ml-3">
                    <ThemeToggle />
                  </div>

                  {session && (
                    <>
                      <Link
                        title="Notifications"
                        href="/notifications"
                        className="focus-style relative flex-shrink-0 rounded-md  p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                      >
                        <span className="sr-only">View notifications</span>
                        {hasNotifications && (
                          <div className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-pink-600" />
                        )}
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </Link>
                      <Menu as="div" className="relative ml-4">
                        <div>
                          <Menu.Button className="flex rounded-full bg-black text-sm ring-offset-2 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2 focus:ring-offset-white">
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
                          </Menu.Button>
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
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white px-1 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
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
                                    href={item.href || ""}
                                  >
                                    {item.name}
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </>
                  )}
                </div>
              </div>
              <div className="-mr-2 flex items-center md:hidden">
                <ThemeToggle />
                {session && (
                  <Link
                    title="Notifications"
                    href="/notifications"
                    className="nav-button focus-style group relative block"
                  >
                    <span className="sr-only">View notifications</span>
                    {hasNotifications && (
                      <div className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-pink-500" />
                    )}
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                )}
                {/* Mobile menu button */}
                <Disclosure.Button className="nav-button focus-style group">
                  <span className="sr-only">Open main menu</span>
                  <AnimatedHamburger open={open} />
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <MobileNav session={session} userNavigation={userNavigation} />
        </>
      )}
    </Disclosure>
  );
};

export default Nav;
