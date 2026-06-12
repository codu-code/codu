import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "My posts",
  description: "Manage your drafts, scheduled and published posts.",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }
  return <Content username={session.user.username || null} />;
}
