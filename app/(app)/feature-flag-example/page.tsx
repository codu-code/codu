import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "Courses Landing Page",
};

export default async function CoursesPage() {
  // Get session if needed for authentication purposes
  const session = await getServerAuthSession();

  return <Content session={session} />;
}
