import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./_client";

export const metadata = {
  title: "Admin Dashboard - Codú",
  description: "Admin dashboard for managing Codú platform",
};

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminDashboard />;
}
