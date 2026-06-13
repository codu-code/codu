"use client";

import { api } from "@/server/trpc/react";
import { Menu, Transition } from "@headlessui/react";
import { BellIcon } from "@heroicons/react/20/solid";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { type Session } from "next-auth";
import { type PostStatus, status } from "@/utils/post";

type EditorNavProps = {
  session: Session | null;
  username: string | null;
  postStatus: PostStatus | null;
  unsavedChanges: boolean;
  onPublish: () => void;
  isDisabled: boolean;
  savedTime?: string;
  isSaving?: boolean;
};

const EditorNav = ({
  session,
  username,
  postStatus,
  unsavedChanges,
  onPublish,
  isDisabled,
  savedTime,
  isSaving,
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
    <nav
      aria-label="Editor navigation"
      className="sticky top-0 z-50 border-b border-hairline bg-canvas"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/codu.png"
                alt="Codú"
                height={16}
                width={64}
                className="dark:invert-0"
              />
            </Link>

            {statusText && (
              <span className="font-mono text-xs uppercase tracking-label text-muted">
                {statusText}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {savedTime && (
              <span className="font-mono text-xs text-faint">
                {isSaving ? "Saving..." : `Saved ${savedTime}`}
              </span>
            )}
            <button
              onClick={onPublish}
              disabled={isDisabled}
              className="primary-button disabled:cursor-not-allowed"
            >
              {postStatus === status.PUBLISHED ? "Save changes" : "Publish"}
            </button>

            {session && (
              <>
                <Link
                  href="/notifications"
                  className="focus-style relative rounded-full p-1 text-muted transition-colors hover:bg-elevated hover:text-fg"
                >
                  <span className="sr-only">View notifications</span>
                  {hasNotifications && (
                    <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent" />
                  )}
                  <BellIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="flex rounded-full text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
                      <span className="sr-only">Open user menu</span>
                      {session.user?.image ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={session.user.image}
                          alt={`${session.user.name}'s avatar`}
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-inset font-mono text-fg">
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
                    <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg border border-hairline bg-elevated px-1 py-1 shadow-lg focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {item.onClick ? (
                            <button
                              onClick={item.onClick}
                              className="flex w-full rounded px-4 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              className="block rounded px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
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
      </div>
    </nav>
  );
};

export default EditorNav;
