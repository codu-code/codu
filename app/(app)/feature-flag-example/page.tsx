import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "This is a feature flag example",
};

export default async function Page() {
  // Example of grabbing session in case it is needed
  const session = await getServerAuthSession();

  return <Content session={session} />;
}
