"use client";

import type { NextPage } from "next";
import { useSearchParams } from "next/navigation";
import { PostAuthPage } from "../page";

const Page: NextPage = () => {
  const errorHeadings = {
    // sign in link already used or expired
    verification: {
      heading: "The sign in link is no longer valid",
      subHeading: "It may have been used already or it may have expired",
    },
    // issue with email provider. SNS may be down or something similiar
    emailsignin: {
      heading: "Well this is embarrassing",
      subHeading: "Something unexpected happened, we will look into it",
    },
    // if specific error param is not found give the generic
    unknown: {
      heading: "Oops... Not sure what happened there",
      subHeading: "Please try again later",
    },
  };
  // Checking does the error query param exist and if it doesnt replacing with unknown
  const error = (useSearchParams().get("error")?.toLowerCase() ??
    "unknown") as keyof typeof errorHeadings;
  // Checking does the error query param has been covered in errorHeading if not falling back to unknown
  return PostAuthPage(
    errorHeadings[error] ? errorHeadings[error] : errorHeadings.unknown,
  );
};

export default Page;
