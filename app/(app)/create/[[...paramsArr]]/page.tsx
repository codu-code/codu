import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "New post - Codú",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }

  return <Content session={session} />;
}
