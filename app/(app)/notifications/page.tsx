import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

// @TODO - Add notifications count to title:
// `Notfications ${count ? `(${count}) 🔔` : "| No new notifications"}`
// Suggestion - Maybe add dynamic favicon showing notifications by default?
export const metadata = {
  title: "Notifications | No new notifications",
  description: "You notification page. Look at your latest notifications.",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }
  return <Content />;
}
