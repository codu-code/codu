"use client";
import HolyLoader from "holy-loader";

const ProgressBar = () => {
  return (
    <HolyLoader
      easing="linear"
      color="linear-gradient(
        to right,
        rgb(251, 146, 60),
        rgb(219, 39, 119)
      )"
      zIndex={50}
      height="0.25rem"
    />
  );
};

export default ProgressBar;
