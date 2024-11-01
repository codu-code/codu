import { getServerAuthSession } from "@/server/auth";
import Content from "./_client";

export const metadata = {
  title: "Video Course",
};

export default async function Page() {
  // Example of grabbing session in case it is needed
  const session = await getServerAuthSession();

  return <Content session={session} />;
}
