import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

// @TODO - Maybe add Metadata for this page

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }

  return <Content />;
}
