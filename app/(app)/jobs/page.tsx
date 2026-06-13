import type { Metadata } from "next";
import JobsClient from "./_client";

export const metadata: Metadata = {
  title: "AI developer jobs — Codú",
  description:
    "Curated AI developer jobs — roles building with AI, LLMs, and agents. Remote, full-time, freelance, and more.",
};

export default function JobsPage() {
  return <JobsClient />;
}
