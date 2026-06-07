import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import Welcome from "./_client";

export const metadata = {
  title: "Welcome to Codú — let's tune your feed",
  description: "Tell us what you're into so we can tailor your Codú feed.",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }

  // If they've already been through onboarding, skip straight to the feed.
  const [row] = await db
    .select({ onboardedAt: user.onboardedAt })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (row?.onboardedAt) {
    redirect("/feed");
  }

  return <Welcome />;
}
