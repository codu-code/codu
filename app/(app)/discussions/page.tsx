import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { serverApi } from "@/server/trpc/caller";

export const metadata = {
  title: "Discussions — Codú",
  description:
    "Ask questions, swap patterns, and get unstuck. The place to learn out loud with other builders working with AI.",
  // Canonical to the bare path so ?sort/?filter param variants don't get indexed.
  alternates: { canonical: "/discussions" },
  openGraph: {
    title: "Discussions — Codú",
    description:
      "Ask questions, swap patterns, and get unstuck. The place to learn out loud with other builders working with AI.",
    type: "website",
    siteName: "Codú",
  },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page(props: Props) {
  const sp = await props.searchParams;
  const session = await getServerAuthSession();

  // Mirror the client's derivation exactly so the SSR page attaches as
  // initialData to the same query key.
  const view =
    sp.view === "following" && session?.user ? "following" : ("all" as const);
  const sort =
    sp.sort === "active" || sp.sort === "top" ? sp.sort : ("recent" as const);

  // First page server-side so the thread list is in the crawlable HTML.
  const initialList = await serverApi()
    .then((api) => api.discussion.list({ limit: 25, view, sort }))
    .catch(() => null);

  return <Content initialList={initialList} />;
}
