"use client";

import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { type Session } from "next-auth";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { api } from "@/server/trpc/react";
import { useShellActions } from "@/components/Create/ShellActionsProvider";

interface TopBarProps {
  session: Session | null;
  username: string | null;
  onOpenPalette: () => void;
  /** Open the slide-out nav drawer (hamburger, shown ≤720px). */
  onOpenMenu?: () => void;
}

/**
 * The sticky top bar: logo → feed, a search button styled like an input that
 * opens the ⌘K palette, primary nav, and Write + avatar menu (or Log in / Join
 * free when logged out).
 */
export function TopBar({
  session,
  username,
  onOpenPalette,
  onOpenMenu,
}: TopBarProps) {
  const { openCompose } = useShellActions();
  const { data: count } = api.notification.getCount.useQuery(undefined, {
    enabled: !!session,
  });
  const hasNotifications = !!count && count > 0;

  return (
    <header className="app-topbar">
      <div className="flex items-center gap-2 justify-self-start">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="nav-burger items-center justify-center rounded-md p-1 text-fg hover:bg-elevated"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link href="/" aria-label="Codú — home" className="flex shrink-0">
          <Image
            src="/images/codu.png"
            alt="Codú"
            height={16}
            width={64}
            className="dark:invert-0"
          />
        </Link>
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="flex w-full min-w-0 max-w-[440px] items-center gap-2 justify-self-center rounded-full border border-hairline bg-surface py-1.5 pl-3.5 pr-2.5 text-left transition-colors duration-base ease-out hover:border-strong"
      >
        <span className="text-sm leading-none text-faint">⌕</span>
        <span className="min-w-0 flex-1 truncate text-sm text-faint">
          Search…
        </span>
        <kbd className="rounded-sm border border-hairline px-1.5 py-px font-mono text-[11px] leading-snug text-faint max-[560px]:hidden">
          ⌘K
        </kbd>
      </button>

      {session ? (
        <div className="flex items-center gap-3 justify-self-end">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative hidden rounded-md p-1.5 text-muted hover:bg-elevated hover:text-fg sm:block"
          >
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-accent" />
            )}
            <BellGlyph />
          </Link>
          <button
            onClick={() => openCompose("discussion")}
            className="primary-button"
          >
            <span className="mr-0.5 text-[15px] leading-none">+</span> Create
          </button>
          <Menu as="div" className="relative">
            <MenuButton
              className="flex rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              aria-label="Account menu"
            >
              <Avatar name={session.user?.name} image={session.user?.image} />
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
              <MenuItems className="absolute right-0 z-50 mt-2.5 w-44 origin-top-right rounded-lg border border-strong bg-elevated p-2 shadow-pop focus:outline-none">
                <div className="mb-1 border-b border-hairline px-2 pb-2">
                  <div className="text-sm font-semibold text-fg">
                    {session.user?.name}
                  </div>
                  {username && (
                    <div className="font-mono text-xs text-faint">
                      @{username}
                    </div>
                  )}
                </div>
                {[
                  { name: "Profile", href: `/${username || "settings"}` },
                  { name: "My posts", href: "/my-posts" },
                  { name: "Settings", href: "/settings" },
                ].map((item) => (
                  <MenuItem key={item.name}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-2 text-sm text-fg data-[focus]:bg-surface"
                    >
                      {item.name}
                    </Link>
                  </MenuItem>
                ))}
                <MenuItem>
                  <button
                    onClick={() => signOut()}
                    className="mt-1 block w-full rounded-md border-t border-hairline px-2 py-2 text-left text-sm text-muted data-[focus]:bg-surface"
                  >
                    Log out
                  </button>
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
      ) : (
        <div className="flex items-center gap-3 justify-self-end">
          <button
            onClick={() => signIn()}
            className="whitespace-nowrap text-sm font-semibold text-fg"
          >
            Log in
          </button>
          <button
            onClick={() => signIn()}
            className="primary-button whitespace-nowrap"
          >
            Join free
          </button>
        </div>
      )}
    </header>
  );
}

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={`${name ?? "Your"} avatar`}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-hairline"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-on-accent">
      {name?.[0]?.toUpperCase() || "C"}
    </span>
  );
}

function BellGlyph() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m6.714 0a3 3 0 1 1-6.714 0m6.714 0a23.97 23.97 0 0 1-6.714 0"
      />
    </svg>
  );
}
