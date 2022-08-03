import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { BellIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import { PlusSmIcon } from "@heroicons/react/solid";
import {
  navigation,
  userNavigation,
  subNav,
  userSubNav,
} from "../../config/site_settings";

function classNames(...classes: String[]) {
  return classes.filter(Boolean).join(" ");
}

const Nav: NextPage = () => {
  const { data: session, status } = useSession();

  return (
    <Disclosure as="nav" className="bg-black">
      {({ open }) => (
        <>
          <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="sr-only">Codú</span>
                  <Link href="/">
                    <a className="hidden lg:block h-8 w-auto">
                      <Image
                        src="/images/codu.png"
                        alt="Codú logo"
                        height={30}
                        width={94.5}
                      />
                    </a>
                  </Link>
                  <Link href="/">
                    <a className="block lg:hidden w-auto">
                      <svg className="h-8" viewBox="0 0 694 829" fill="none">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M674.287 736.808C600.91 796.992 508.826 829.601 413.972 828.992C299.426 828.992 201.794 788.584 121.077 707.77C40.3589 626.955 0 529.206 0 414.523C0 300.208 40.3589 202.624 121.077 121.773C201.794 40.9216 299.426 0.330605 413.972 0C512.007 0 600.504 32.3074 679.46 96.9223C684.376 101.861 688.203 107.777 690.696 114.287C693.189 120.797 694.292 127.758 693.934 134.722C694.032 142.18 692.628 149.582 689.807 156.486C687.101 162.973 683.157 168.869 678.194 173.843C673.163 178.876 667.174 182.848 660.583 185.524C650.668 189.611 639.776 190.709 629.246 188.682C618.716 186.656 609.006 181.594 601.311 174.119C575.29 153.479 545.988 137.367 514.631 126.456C482.257 115.271 448.218 109.682 413.972 109.926C373.998 109.875 334.407 117.721 297.466 133.013C260.526 148.305 226.961 170.744 198.695 199.043C170.429 227.343 148.018 260.948 132.744 297.933C117.47 334.918 109.634 374.557 109.684 414.578C109.684 499.066 139.183 570.918 198.18 630.133C251.394 683.086 322.202 714.596 397.119 718.66C472.037 722.724 545.831 699.06 604.448 652.173C613.944 645.823 625.113 642.447 636.533 642.475C643.828 642.424 651.05 643.927 657.721 646.883C664.132 649.742 669.998 653.694 675.057 658.565C680.128 663.517 684.185 669.413 687 675.922C689.92 682.706 691.4 690.024 691.348 697.411C691.282 704.787 689.739 712.074 686.808 718.842C683.878 725.609 679.62 731.719 674.287 736.808Z"
                          fill="white"
                        />
                      </svg>
                    </a>
                  </Link>
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
                          className="text-gray-300 hover:bg-gray-900 hover:text-white px-3 py-2 rounded-md"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <Link key={item.name} href={item.href}>
                          <a className="text-gray-300 hover:bg-gray-900 hover:text-white px-3 py-2 rounded-md">
                            {item.name}
                          </a>
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
                      <Link href="/drafts">
                        <a className="text-gray-300 hover:bg-gray-900 hover:text-white px-3 py-2 rounded-md">
                          Drafts
                        </a>
                      </Link>
                      <Link href="/new-post">
                        <a className="ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300">
                          New Post
                        </a>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/get-started">
                        <a className="text-gray-300 hover:bg-gray-900 hover:text-white px-3 py-2 rounded-md">
                          Sign in
                        </a>
                      </Link>
                      <Link href="/get-started">
                        <a className="ml-4 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300">
                          Sign up for free
                        </a>
                      </Link>
                    </>
                  )}
                  {/* Profile dropdown */}
                  {session && (
                    <Menu as="div" className="ml-4 relative">
                      <div>
                        <Menu.Button className="bg-gray-900 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                          <span className="sr-only">Open user menu</span>

                          <img
                            className="h-10 w-10 rounded-full bg-gray-300"
                            src={session?.user?.image || "/images/person.png"}
                            alt={`${session.user?.name}'s avatar`}
                          />
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
                                    "flex text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                  }
                                  onClick={item.onClick}
                                >
                                  {item.name}
                                </button>
                              ) : (
                                <Link href={item.href || ""}>
                                  <a
                                    className={
                                      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded"
                                    }
                                  >
                                    {item.name}
                                  </a>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  )}
                </div>
              </div>
              <div className="-mr-2 flex md:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
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
                    className="text-gray-300 hover:bg-gray-900 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  >
                    {item.name}
                  </Disclosure.Button>
                ) : (
                  <Link key={item.name} href={item.href}>
                    <Disclosure.Button
                      as="a"
                      className="text-gray-300 hover:bg-gray-900 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    >
                      {item.name}
                    </Disclosure.Button>
                  </Link>
                )
              )}

              <div className="pt-3 pb-3 border-t border-gray-700 flex  flex-col space-y-1">
                {session ? (
                  <>
                    {userSubNav.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <a
                          className={classNames(
                            item.fancy
                              ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                              : "text-gray-300 hover:bg-gray-900 hover:text-white block px-3",
                            "rounded-md text-base font-medium py-2"
                          )}
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    {subNav.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <a
                          className={classNames(
                            item.fancy
                              ? "bg-gradient-to-r from-orange-400 to-pink-600 shadow-sm px-4 block justify-center text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300"
                              : "text-gray-300 hover:bg-gray-900 hover:text-white block px-3",
                            "rounded-md text-base font-medium py-2"
                          )}
                        >
                          {item.name}
                        </a>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>

            {session && (
              <div className="px-2 pt-2 space-y-1">
                <div className="pt-4 pb-3 border-t border-gray-700">
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
                      <div className="text-sm font-medium text-gray-400">
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
                          className="cursor-pointer block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-900"
                        >
                          {item.name}
                        </Disclosure.Button>
                      ) : (
                        <Link key={item.name} href={item.href}>
                          <Disclosure.Button
                            as="a"
                            className="cursor-pointer block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-900"
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
  // <Popover as="header" className="relative z-10">
  //   <div className="pt-6">
  //     <nav
  //       className="relative mx-auto flex items-center justify-between px-4 sm:px-6 pb-4"
  //       aria-label="Global"
  //     >
  //       <div className="flex items-center flex-1 justify-between">
  //         <div className="flex items-center justify-between w-full md:w-auto">
  //           <Link href="/">
  //             <a>
  //               <span className="sr-only">Codú</span>
  //               <Image
  //                 src="/images/codu.png"
  //                 alt="Codú logo"
  //                 height={30}
  //                 width={94.5}
  //               />
  //             </a>
  //           </Link>
  //           <div className="-mr-2 flex items-center md:hidden">
  //             <Popover.Button className=" rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus-ring-inset focus:ring-white">
  //               <span className="sr-only">Open main menu</span>
  //               <MenuIcon className="h-6 w-6" aria-hidden="true" />
  //             </Popover.Button>
  //           </div>
  //         </div>
  //         <div className="hidden space-x-8 md:flex md:ml-10">
  //           {navigation.map((item) =>
  //             item.href.includes("http") ? (
  //               <a
  //                 key={item.name}
  //                 href={item.href}
  //                 target="_blank"
  //                 rel="noopener noreferrer"
  //                 className="text-base font-medium text-white hover:text-gray-300"
  //               >
  //                 {item.name}
  //               </a>
  //             ) : (
  //               <Link key={item.name} href={item.href}>
  //                 <a className="text-base font-medium text-white hover:text-gray-300">
  //                   {item.name}
  //                 </a>
  //               </Link>
  //             )
  //           )}
  //         </div>
  //         <div className="hidden md:flex items-center">
  //           {!session && (
  //             <>
  //               <Link href="/get-started">
  //                 <a className="text-base font-medium text-white hover:text-gray-300">
  //                   Sign in
  //                 </a>
  //               </Link>
  //               <Link href="/get-started">
  //                 <a className="ml-6 bg-gradient-to-r from-orange-400 to-pink-600 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300">
  //                   Join for free
  //                 </a>
  //               </Link>
  //             </>
  //           )}
  //           {session && (
  //             <button
  //               onClick={signOut}
  //               className="text-base font-medium text-white hover:text-gray-300"
  //             >
  //               Sign out
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </nav>
  //   </div>

  //   <Transition
  //     as={Fragment}
  //     enter="duration-150 ease-out"
  //     enterFrom="opacity-0 scale-95"
  //     enterTo="opacity-100 scale-100"
  //     leave="duration-100 ease-in"
  //     leaveFrom="opacity-100 scale-100"
  //     leaveTo="opacity-0 scale-95"
  //   >
  //     <Popover.Panel
  //       focus
  //       className="absolute top-0 inset-x-0 p-2 transition transform origin-top md:hidden"
  //     >
  //       <div className="rounded-lg shadow-md bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
  //         <div className="px-5 pt-4 flex items-center justify-between">
  //           <Link href="/">
  //             <a className="hover:bg-slate-50 border-r">
  //               <Image
  //                 src="/images/codu-black.png"
  //                 alt="Codú logo"
  //                 height={24}
  //                 width={75.6}
  //               />
  //             </a>
  //           </Link>
  //           <div className="-mr-2">
  //             <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-600">
  //               <span className="sr-only">Close menu</span>
  //               <XIcon className="h-6 w-6" aria-hidden="true" />
  //             </Popover.Button>
  //           </div>
  //         </div>
  //         <div className="pt-5 pb-6">
  //           <div className="px-2 space-y-1">
  //             {navigation.map((item) =>
  //               item.href.includes("http") ? (
  //                 <a
  //                   key={item.name}
  //                   href={item.href}
  //                   target="_blank"
  //                   rel="noopener noreferrer"
  //                   className="block px-3 py-2 rounded-md text-base font-medium text-black hover:bg-gray-50"
  //                 >
  //                   {item.name}
  //                 </a>
  //               ) : (
  //                 <Link key={item.name} href={item.href}>
  //                   <a className="block px-3 py-2 rounded-md text-base font-medium text-black hover:bg-gray-50">
  //                     {item.name}
  //                   </a>
  //                 </Link>
  //               )
  //             )}
  //           </div>
  //           <div className="mt-6 px-5"></div>
  //           <a
  //             href={discordInviteUrl}
  //             target="_blank"
  //             rel="noopener noreferrer"
  //             className="block text-center mx-4 py-3 px-4 rounded-md shadow bg-gradient-to-r from-orange-400 to-pink-600 text-white font-medium hover:from-orange-500 hover:to-pink-700"
  //           >
  //             Join the community
  //           </a>
  //         </div>
  //       </div>
  //     </Popover.Panel>
  //   </Transition>
  // </Popover>
  // );
};

export default Nav;
