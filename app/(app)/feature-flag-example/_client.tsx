"use client";
import { type Session } from "next-auth";
import { notFound } from "next/navigation";
import { isFlagEnabled, FEATURE_FLAGS } from "@/utils/flags";

const Content = ({ session }: { session: Session | null }) => {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.FEATURE_FLAG_TEST);

  if (!flagEnabled) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg">
        This page is behind a feature flag. It will work in development or when
        the flag is turned on.
      </h1>
      <p className="mt-8 text-sm">
        {session ? "User is logged in" : "User is not logged in"}
      </p>
    </div>
  );
};

export default Content;
