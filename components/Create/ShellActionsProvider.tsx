"use client";

import { createContext, useContext, useState } from "react";
import { CreateInfoModal } from "./CreateInfoModal";
import { ComposeModal, type ComposeMode } from "./ComposeModal";
import { TopicsModal } from "./TopicsModal";

const INFO_KEY = "codu_create_info_seen";

interface ShellActions {
  /** Open the create hub on the given tab (gated by the dos-&-don'ts on first use). */
  // eslint-disable-next-line no-unused-vars
  openCompose: (mode?: ComposeMode) => void;
  /** Open the "edit your topics" modal. */
  openTopics: () => void;
  /** Current user's username (for profile-linked UI), or null when unknown. */
  username: string | null;
}

const ShellActionsContext = createContext<ShellActions | null>(null);

export function useShellActions(): ShellActions {
  const ctx = useContext(ShellActionsContext);
  // Tolerate consumers rendered outside the provider (e.g. tests) with no-ops.
  return ctx ?? { openCompose: () => {}, openTopics: () => {}, username: null };
}

/**
 * Provides create + topics actions to the app shell and renders their modals.
 * Create is gated on first use by a one-time dos-&-don'ts modal (localStorage).
 */
export function ShellActionsProvider({
  authed,
  username,
  children,
}: {
  authed: boolean;
  username: string | null;
  children: React.ReactNode;
}) {
  const [compose, setCompose] = useState<ComposeMode | null>(null);
  const [pendingInfo, setPendingInfo] = useState<ComposeMode | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);

  const hasSeenInfo = () => {
    try {
      return !!localStorage.getItem(INFO_KEY);
    } catch {
      return false;
    }
  };

  const openCompose = (mode: ComposeMode = "discussion") => {
    if (!authed) return; // logged-out create is gated elsewhere (sign-in)
    if (hasSeenInfo()) setCompose(mode);
    else setPendingInfo(mode);
  };

  const ackInfo = () => {
    try {
      localStorage.setItem(INFO_KEY, "1");
    } catch {
      // ignore storage failures
    }
    const mode = pendingInfo ?? "discussion";
    setPendingInfo(null);
    setCompose(mode);
  };

  return (
    <ShellActionsContext.Provider
      value={{ openCompose, openTopics: () => setTopicsOpen(true), username }}
    >
      {children}
      {pendingInfo && (
        <CreateInfoModal
          onClose={() => setPendingInfo(null)}
          onContinue={ackInfo}
        />
      )}
      {compose && (
        <ComposeModal
          mode={compose}
          username={username}
          onClose={() => setCompose(null)}
        />
      )}
      {topicsOpen && <TopicsModal onClose={() => setTopicsOpen(false)} />}
    </ShellActionsContext.Provider>
  );
}
