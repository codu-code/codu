"use client";
import HolyLoader from "holy-loader";

const ProgressBar = () => {
  return (
    <HolyLoader
      easing="linear"
      // Relaunch mint (accent → accent-soft), not the old orange/pink.
      color="linear-gradient(to right, rgb(45, 212, 191), rgb(110, 231, 214))"
      zIndex={50}
      height="0.2rem"
    />
  );
};

export default ProgressBar;
