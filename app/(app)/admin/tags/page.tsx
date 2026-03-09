import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import TagsAdmin from "./_client";

export const metadata = {
  title: "Tag Management - Codú Admin",
  description: "Manage tags and topics on the Codú platform",
};

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <TagsAdmin />;
}
