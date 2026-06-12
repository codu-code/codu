"use client";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  /** Server-resolved session so useSession() is populated during SSR and the
   * first client render — otherwise session-derived query keys (e.g. the
   * feed's `following` input) flip after hydration and detach initialData. */
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
