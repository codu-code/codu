import AdminDashboard from "./_client";

export const metadata = {
  title: "Admin Dashboard - Codú",
  description: "Admin dashboard for managing Codú platform",
};

// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default function Page() {
  return <AdminDashboard />;
}
