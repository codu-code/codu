import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "Join Codú — sign in or create your account",
  description: "Sign in or sign up to get free access to the Codú community.",
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/");
  }

  return <Content />;
}
