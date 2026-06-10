import Content from "./_client";

export const metadata = {
  title: "Discussions — Codú",
  description:
    "Ask questions, swap patterns, and get unstuck. The place to learn out loud with other builders working with AI.",
  // Canonical to the bare path so ?sort/?filter param variants don't get indexed.
  alternates: { canonical: "/discussions" },
  openGraph: {
    title: "Discussions — Codú",
    description:
      "Ask questions, swap patterns, and get unstuck. The place to learn out loud with other builders working with AI.",
    type: "website",
    siteName: "Codú",
  },
};

export default function Page() {
  return <Content />;
}
