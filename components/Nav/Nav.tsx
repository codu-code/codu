import { signOut, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { useSession } from "next-auth/react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { PlusSmIcon, BellIcon } from "@heroicons/react/solid";
import { navigation, subNav, userSubNav } from "../../config/site_settings";
import { trpc } from "../../utils/trpc";
import ThemeToggle from "../Theme/ThemeToggle";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Nav = () => {
  const { data: session } = useSession();

  const { data: count } = trpc.notification.getCount.useQuery(undefined, {
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
    <Disclosure as="nav" className="bg-white dark:bg-black">
      {({ open }) => (
        <>
          <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="sr-only">Codú</span>
                  <Link
                    className="hidden lg:flex items-baseline h-8 w-auto"
                    href="/"
                  >
                    <Image
                      src="/images/codu.png"
                      alt="Codú logo"
                      height={30}
                      width={94.5}
                      priority
                      sizes="(max-width: 94px) 100vw"
                    />{" "}
                    <span className="ml-2 text-xs font-semibold">Beta</span>
                  </Link>
                  <div className="flex">
                    <Link className="flex lg:hidden w-auto items-end" href="/">
                      <span className="sr-only">Codú</span>
                      <svg className="h-8" viewBox="0 0 694 829" fill="none">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M674.287 736.808C600.91 796.992 508.826 829.601 413.972 828.992C299.426 828.992 201.794 788.584 121.077 707.77C40.3589 626.955 0 529.206 0 414.523C0 300.208 40.3589 202.624 121.077 121.773C201.794 40.9216 299.426 0.330605 413.972 0C512.007 0 600.504 32.3074 679.46 96.9223C684.376 101.861 688.203 107.777 690.696 114.287C693.189 120.797 694.292 127.758 693.934 134.722C694.032 142.18 692.628 149.582 689.807 156.486C687.101 162.973 683.157 168.869 678.194 173.843C673.163 178.876 667.174 182.848 660.583 185.524C650.668 189.611 639.776 190.709 629.246 188.682C618.716 186.656 609.006 181.594 601.311 174.119C575.29 153.479 545.988 137.367 514.631 126.456C482.257 115.271 448.218 109.682 413.972 109.926C373.998 109.875 334.407 117.721 297.466 133.013C260.526 148.305 226.961 170.744 198.695 199.043C170.429 227.343 148.018 260.948 132.744 297.933C117.47 334.918 109.634 374.557 109.684 414.578C109.684 499.066 139.183 570.918 198.18 630.133C251.394 683.086 322.202 714.596 397.119 718.66C472.037 722.724 545.831 699.06 604.448 652.173C613.944 645.823 625.113 642.447 636.533 642.475C643.828 642.424 651.05 643.927 657.721 646.883C664.132 649.742 669.998 653.694 675.057 658.565C680.128 663.517 684.185 669.413 687 675.922C689.92 682.706 691.4 690.024 691.348 697.411C691.282 704.787 689.739 712.074 686.808 718.842C683.878 725.609 679.62 731.719 674.287 736.808Z"
                          fill="white"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className="hidden md:block md:ml-6 text-sm lg:text-base font-medium">
                  <div className="flex space-x-4">
                    {navigation.map((item) =>
                      item.href.includes("http") ? (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-neutral-300 hover:bg-neutral-900 hover:text-white px-3 py-2 rounded-md"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link
                          className="text-neutral-300 hover:bg-neutral-900 hover:text-white px-3 py-2 rounded-md"
                          key={item.name}
                          href={item.href}
                        >
                          {item.name}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
              <div className="hidden md:ml-6 md:block">
                <div className="flex items-center text-sm lg:text-base font-medium">
                  {session ? (
                    <>
                      <Link
                        className="text-neutral-300 hover:bg-neutral-900 hover:text-white px-3 py-2 rounded-md"
                        href="/my-posts"
                      >
                        Your Posts
                      </Link>
                      <Link
                        className="flex-inline items-center ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                        href="/create"
                      >
                        <PlusSmIcon className="h-5 w-5 mr-1 -ml-2 p-0 text-white" />
                        New Post
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-neutral-300 hover:bg-neutral-900 hover:text-white px-3 py-2 rounded-md"
                        onClick={() => signIn()}
                      >
                        Sign in
                      </button>
                      <button
                        className="ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                        onClick={() => signIn()}
                      >
                        Sign up for free
                      </button>
                    </>
                  )}
                  {/* Profile dropdown */}
                  {session && (
                    <>
                      <ThemeToggle />
                      <Link
                        title="Notifications"
                        href="/notifications"
                        className="relative ml-3 flex-shrink-0 rounded-full bg-black p-1 text-neutral-400 hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                      >
                        <span className="sr-only">View notifications</span>
                        {hasNotifications && (
                          <div className="absolute animate-pulse rounded-full h-2 w-2 bg-pink-500 right-1 top-1" />
                        )}
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </Link>
                      <Menu as="div" className="ml-4 relative">
                        <div>
                          <Menu.Button className="bg-black flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            {session.user?.image ? (
                              <img
                                className="h-10 w-10 rounded-full bg-neutral-300 object-cover"
                                src={session?.user?.image}
                                alt={`${session.user?.name}'s avatar`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-black flex justify-center items-center">
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
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 px-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {item.onClick ? (
                                  <button
                                    className={
                                      "flex text-left w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200 rounded"
                                    }
                                    onClick={item.onClick}
                                  >
                                    {item.name}
                                  </button>
                                ) : (
                                  <Link
                                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-200 rounded"
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
                <Link
                  title="Notifications"
                  href="/notifications"
                  className="relative block mr-3 flex-shrink-0 rounded-md bg-black p-2 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
                >
                  <span className="sr-only">View notifications</span>
                  {hasNotifications && (
                    <div className="absolute animate-pulse rounded-full h-2 w-2 bg-pink-500 right-1 top-1" />
                  )}
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </Link>
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden relative z-10 border-b-2 border-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) =>
                item.href.includes("http") ? (
                  <Disclosure.Button
                    as="a"
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-300 hover:bg-neutral-900 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                  </Disclosure.Button>
                ) : (
                  <Link key={item.name} href={item.href}>
                    <Disclosure.Button
                      as="div"
                      className="text-neutral-300 hover:bg-neutral-900 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    >
                      {item.name}
                    </Disclosure.Button>
                  </Link>
                )
              )}

              <div className="pt-3 pb-3 border-t border-neutral-700 flex  flex-col space-y-1">
                {session ? (
                  <>
                    {userSubNav.map((item) => (
                      <Link
                        className={classNames(
                          item.fancy
                            ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            : "text-neutral-300 hover:bg-neutral-900 hover:text-white block px-3",
                          "rounded-md text-base font-medium py-2 text-center"
                        )}
                        key={item.name}
                        href={item.href}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {subNav.map((item) => (
                      <button
                        className={classNames(
                          item.fancy
                            ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                            : "text-neutral-300 hover:bg-neutral-900 hover:text-white block px-3",
                          "rounded-md text-base font-medium py-2"
                        )}
                        key={item.name}
                        onClick={() => signIn()}
                      >
                        {item.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {session && (
              <div className="px-2 pt-2 space-y-1">
                <div className="pt-4 pb-3 border-t border-neutral-700">
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={session.user?.image || "/images/person.png"}
                        alt={`${session.user?.name}'s avatar`}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">
                        {session.user?.name}
                      </div>
                      <div className="text-sm font-medium text-neutral-400">
                        {session.user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {userNavigation.map((item) =>
                      item.onClick ? (
                        <Disclosure.Button
                          key={item.name}
                          as="button"
                          onClick={item.onClick}
                          className="cursor-pointer block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-400 hover:text-white hover:bg-neutral-900"
                        >
                          {item.name}
                        </Disclosure.Button>
                      ) : (
                        <Link key={item.name} href={item.href}>
                          <Disclosure.Button
                            as="div"
                            className="cursor-pointer block px-3 py-2 rounded-md text-base font-medium text-neutral-400 hover:text-white hover:bg-neutral-900"
                          >
                            {item.name}
                          </Disclosure.Button>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Nav;
