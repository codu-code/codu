import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";

export const metadata = {
  title: "Edit Post - Codú",
  description:
    "Create and edit your articles with Codú's powerful writing editor. Share your knowledge and insights with the developer community.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  publisher: "Codú",
  applicationName: "Codú",
  keywords: [
    "article editor",
    "writing",
    "blogging",
    "tech articles",
    "developer content",
    "programming",
    "web development",
    "coding tutorials",
    "technical writing",
    "knowledge sharing",
  ],
  metadataBase: new URL("https://www.codu.co"),
  openGraph: {
    images: "/images/og/home-og.png",
  },
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/get-started");
  }

  return <Content session={session} />;
}
