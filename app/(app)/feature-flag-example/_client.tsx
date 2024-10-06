"use client";

import { type Session } from "next-auth";
import { notFound } from "next/navigation";
import { isFlagEnabled, FEATURE_FLAGS } from "@/utils/flags";
import CoursesLanding from "@/components/Course/CourseLanding";

const Content = ({ session }: { session: Session | null }) => {
  const flagEnabled = isFlagEnabled(FEATURE_FLAGS.COURSES_LANDING); // Adjust to the correct flag

  if (!flagEnabled) {
    notFound(); // Show 404 page if the feature flag is not enabled
  }

  return (
    <div className="mx-auto max-w-6xl">
      <CoursesLanding session={session} />
    </div>
  );
};

export default Content;
