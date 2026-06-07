"use client";

import { useEffect, useState } from "react";
import { type Session } from "next-auth";
import { TopBar } from "./TopBar";
import { LeftRail } from "./LeftRail";
import { RightRail } from "./RightRail";
import { SignInBar } from "./SignInBar";
import { CommandPalette } from "@/components/CommandPalette/CommandPalette";

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="min-h-svh bg-canvas text-fg"
      style={{ paddingBottom: session ? 0 : 56 }}
    >
      <TopBar
        session={session}
        username={username}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <main className="app-main">
        <LeftRail session={session} username={username} />
        <div className="min-w-0">{children}</div>
        <RightRail session={session} />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
      {!session && <SignInBar />}
    </div>
  );
}
