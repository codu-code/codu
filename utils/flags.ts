import { posthog } from "posthog-js";

export const FEATURE_FLAGS = {
  FEATURE_FLAG_TEST: "feature-flag-test",
  COURSES_LANDING: "courses-landing",
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
  disableDevCheck = false,
) => {
  if (!disableDevCheck && isDevEnvironment()) {
    console.log("Feature flag check skipped in development environment");
    return true; // Always true in dev environments unless you want to test differently
  }
  return posthog.isFeatureEnabled(featureFlag);
};
