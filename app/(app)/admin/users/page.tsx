import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import UserManagement from "./_client";

export const metadata = {
  title: "User Management - Codú Admin",
  description: "Search and manage users",
};

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <UserManagement />;
}
