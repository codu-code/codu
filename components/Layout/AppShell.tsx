"use client";

import { useEffect, useRef, useState } from "react";
import { type Session } from "next-auth";
import { TopBar } from "./TopBar";
import { LeftRail } from "./LeftRail";
import { RightRail } from "./RightRail";
import { SignInBar } from "./SignInBar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "@/components/CommandPalette/CommandPalette";
import { ShellActionsProvider } from "@/components/Create/ShellActionsProvider";

interface AppShellProps {
  children: React.ReactNode;
  session: Session | null;
  username: string | null;
}

/**
 * The relaunch app shell: a sticky top bar over a 3-column rail grid (left rail
 * / center / right rail), with the ⌘K command palette and the logged-out
 * sign-in bar. Replaces the old single-sidebar layout.
 * Mirrors ui_kits/app/AppShell.jsx.
 */
export function AppShell({ children, session, username }: AppShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Remember the element that opened the palette so focus can be restored.
  const paletteTrigger = useRef<HTMLElement | null>(null);

  const openPalette = () => {
    paletteTrigger.current = document.activeElement as HTMLElement;
    setPaletteOpen(true);
  };
  const closePalette = () => {
    setPaletteOpen(false);
    paletteTrigger.current?.focus?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (paletteOpen) {
          closePalette();
        } else {
          paletteTrigger.current = document.activeElement as HTMLElement;
          setPaletteOpen(true);
        }
      } else if (e.key === "Escape" && paletteOpen) {
        closePalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen]);

  return (
    <ShellActionsProvider authed={!!session} username={username}>
      <div
        className="min-h-svh bg-canvas text-fg"
        style={{ paddingBottom: session ? 0 : 56 }}
      >
        <TopBar
          session={session}
          username={username}
          onOpenPalette={openPalette}
        />
        <main className="app-main">
          <LeftRail session={session} username={username} />
          <div className="min-w-0">{children}</div>
          <RightRail session={session} />
        </main>

        {paletteOpen && <CommandPalette onClose={closePalette} />}
        {!session && <SignInBar />}
        <MobileNav session={session} username={username} />
      </div>
    </ShellActionsProvider>
  );
}
