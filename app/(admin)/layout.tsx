import React from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/server/auth";
import { AdminShell } from "@/components/Admin/AdminShell";

export const metadata = {
  title: "Admin - Codú",
  description: "Private admin dashboard for managing the Codú platform",
  robots: { index: false, follow: false },
};

/**
 * Layout for the private `(admin)` route group. The admin-role gate is enforced
 * ONCE here for the whole section, so individual pages don't repeat it. This
 * group is a sibling of `(app)`, so it is fully outside the public AppShell
 * rails — admin gets its own full-width cockpit.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminShell user={{ name: session.user.name, image: session.user.image }}>
      {children}
    </AdminShell>
  );
}
