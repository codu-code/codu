import { Suspense } from "react";
import ModerationQueue from "./_client";

export const metadata = {
  title: "Moderation Queue - Codú Admin",
  description: "Review and manage reported content",
};

// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default function Page() {
  return (
    <Suspense>
      <ModerationQueue />
    </Suspense>
  );
}
