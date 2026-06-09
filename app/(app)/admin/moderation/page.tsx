import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ModerationQueue from "./_client";

export const metadata = {
  title: "Moderation Queue - Codú Admin",
  description: "Review and manage reported content",
};

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <Suspense>
      <ModerationQueue />
    </Suspense>
  );
}
