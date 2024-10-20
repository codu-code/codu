"use client";

import { api } from "@/server/trpc/react";
import { Menu, Transition } from "@headlessui/react";
import { BellIcon } from "@heroicons/react/20/solid";
import { signOut } from "next-auth/react";
import { PromptLink as Link } from "@/components/PromptService/PromptLink";
import { Fragment } from "react";
import { type Session } from "next-auth";
import Logo from "@/icons/logo.svg";
import { type PostStatus, status } from "@/utils/post";

type EditorNavProps = {
  session: Session | null;
  username: string | null;
  postStatus: PostStatus | null;
  unsavedChanges: boolean;
  onPublish: () => void;
  isDisabled: boolean;
};

const EditorNav = ({
  session,
  username,
  postStatus,
  unsavedChanges,
  onPublish,
  isDisabled,
}: EditorNavProps) => {
  const { data: count } = api.notification.getCount.useQuery(undefined, {
    enabled: !!session,
  });

  const userNavigation = [
    { name: "Your Profile", href: `/${username || "settings"}` },
    { name: "Settings", href: "/settings" },
    { name: "Sign out", onClick: () => signOut() },
  ];

  const hasNotifications = !!count && count > 0;

  const getStatusText = () => {
    if (postStatus === null) return null;

    switch (postStatus) {
      case status.DRAFT:
        return unsavedChanges ? "Draft - Unsaved changes" : "Draft - Saved";
      case status.PUBLISHED:
        return unsavedChanges ? "Published - Unsaved changes" : "Published";
      case status.SCHEDULED:
        return unsavedChanges ? "Scheduled - Unsaved changes" : "Scheduled";
      default:
        return null;
    }
  };

  const statusText = getStatusText();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center">
              <Logo className="h-6 w-auto" />
            </Link>

            {statusText && (
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {statusText}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onPublish}
              disabled={isDisabled}
              className="rounded-md bg-gradient-to-r from-orange-400 to-pink-600 px-3 py-1.5 text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {postStatus === status.PUBLISHED ? "Save changes" : "Publish"}
            </button>

            {session && (
              <>
                <Link
                  to="/notifications"
                  className="focus-style relative rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  <span className="sr-only">View notifications</span>
                  {hasNotifications && (
                    <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-pink-500" />
                  )}
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2">
                      <span className="sr-only">Open user menu</span>
                      {session.user?.image ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={session.user.image}
                          alt={`${session.user.name}'s avatar`}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-300">
                          {session.user?.name?.[0] || "U"}
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
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) =>
                            item.onClick ? (
                              <button
                                onClick={item.onClick}
                                className={`${
                                  active ? "bg-neutral-100" : ""
                                } block w-full px-4 py-2 text-left text-sm text-neutral-700`}
                              >
                                {item.name}
                              </button>
                            ) : (
                              <Link
                                to={item.href}
                                className={`${
                                  active ? "bg-neutral-100" : ""
                                } block px-4 py-2 text-sm text-neutral-700`}
                              >
                                {item.name}
                              </Link>
                            )
                          }
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default EditorNav;
