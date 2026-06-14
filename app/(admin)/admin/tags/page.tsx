import TagsAdmin from "./_client";

export const metadata = {
  title: "Tag Management - Codú Admin",
  description: "Manage tags and topics on the Codú platform",
};

// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default function Page() {
  return <TagsAdmin />;
}
