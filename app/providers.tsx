"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { type ReactNode } from "react";

if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY as string;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST as string;

  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: "identified_only", // Don't send anonymous profiles
  });
}

interface CSPostHogProviderProps {
  children: ReactNode;
}

export function CSPostHogProvider({ children }: CSPostHogProviderProps) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
