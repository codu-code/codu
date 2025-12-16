import React from "react";
import { notFound } from "next/navigation";

export const metadata = {
  title: "🚨 WIP - Things will break",
  robots: {
    follow: false,
    index: false,
  },
};

export default function Alpha({ children }: { children: React.ReactNode }) {
  if (process.env.ALPHA || process.env.NODE_ENV === "development") {
    return <>{children}</>;
  }
  notFound();
}
