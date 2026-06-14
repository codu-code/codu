import UserManagement from "./_client";

export const metadata = {
  title: "User Management - Codú Admin",
  description: "Search and manage users",
};

// Admin-role gate is enforced in app/(admin)/layout.tsx.
export default function Page() {
  return <UserManagement />;
}
