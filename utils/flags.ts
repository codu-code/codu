import { posthog } from "posthog-js";

export const FEATURE_FLAGS = {
  FEATURE_FLAG_TEST: "feature-flag-test",
  JOBS: "jobs",
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
): boolean => {
  if (!disableDevCheck && isDevEnvironment()) {
    return true;
  }
  return !!posthog.isFeatureEnabled(featureFlag);
};
