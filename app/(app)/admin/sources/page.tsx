import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Feed Sources - Admin",
  description: "Manage RSS feed sources for the content aggregator",
};

export default async function Page() {
  const session = await getServerAuthSession();

  // Redirect non-admin users
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <Content />;
}
