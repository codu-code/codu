import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "Bookmarked posts",
  description: "Find all your bookmarked articles here.",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }
  return <Content />;
}
