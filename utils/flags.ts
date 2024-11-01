import { posthog } from "posthog-js";

export const FEATURE_FLAGS = {
  FEATURE_FLAG_TEST: "feature-flag-test",
  COURSE_VIDEO: "course-video",
  JOBS: "jobs",
  // Add more feature flags as needed
} as const;

export type FeatureFlagName =
  (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export function isDevEnvironment() {
  return (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")
  );
}

export const isFlagEnabled = (
  featureFlag: FeatureFlagName,
  disableDevCheck = false, // Disable dev check to force feature flag to be checked always
) => {
  if (!disableDevCheck && isDevEnvironment()) {
    console.log("Feature flag check skipped in development environment");
    return true;
  }
  return posthog.isFeatureEnabled(featureFlag);
};
