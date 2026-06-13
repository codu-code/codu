"use client";

import * as Headless from "@headlessui/react";
import React, { useState } from "react";
import { NavbarItem } from "./navbar";

function MenuIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function MobileSidebar({
  open,
  close,
  children,
}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 z-40 bg-black/30 transition data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 z-50 w-full max-w-80 p-2 transition duration-300 ease-in-out data-[closed]:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-surface shadow-sm ring-1 ring-hairline">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  );
}

interface SidebarLayoutProps {
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  isCollapsed?: boolean;
}

export function SidebarLayout({
  navbar,
  sidebar,
  children,
  isCollapsed = false,
}: SidebarLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  const contentPadding = isCollapsed ? "lg:pl-16" : "lg:pl-64";

  return (
    <div className="relative isolate flex min-h-svh w-full bg-surface max-lg:flex-col">
      {/* Desktop navbar - completely independent, full width, above everything */}
      <header
        aria-label="Site header"
        className="fixed left-0 right-0 top-0 z-50 hidden h-16 items-center border-b border-hairline bg-surface px-6 lg:flex"
      >
        {navbar}
      </header>

      {/* Sidebar on desktop - starts below navbar */}
      {/* Outer frame: animates width, has border */}
      <div
        data-collapsed={isCollapsed ? "true" : undefined}
        className={`fixed bottom-0 left-0 top-16 z-30 border-r border-hairline transition-all duration-300 ease-in-out max-lg:hidden ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Middle: clips content */}
        <div className="h-full overflow-hidden">
          {/* Inner: fixed width, content doesn't move */}
          <div className="h-full w-64">{sidebar}</div>
        </div>
      </div>

      {/* Sidebar on mobile */}
      <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
        {sidebar}
      </MobileSidebar>

      {/* Navbar on mobile */}
      <header
        aria-label="Site header"
        className="flex items-center border-b border-hairline px-4 lg:hidden"
      >
        <div className="py-2.5">
          <NavbarItem
            onClick={() => setShowSidebar(true)}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </NavbarItem>
        </div>
        <div className="min-w-0 flex-1">{navbar}</div>
      </header>

      {/* Content */}
      <main
        className={`flex flex-1 flex-col transition-all duration-300 ease-in-out lg:min-w-0 lg:pt-16 ${contentPadding}`}
      >
        <div className="grow">{children}</div>
      </main>
    </div>
  );
}
