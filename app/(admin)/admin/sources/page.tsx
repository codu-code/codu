import Content from "./_client";

export const metadata = {
  title: "Feed Sources - Admin",
  description: "Manage RSS feed sources for the content aggregator",
};

// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default function Page() {
  return <Content />;
}
