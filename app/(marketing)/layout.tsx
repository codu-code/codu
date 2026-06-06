import { getServerAuthSession } from "@/server/auth";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { JsonLd } from "@/components/JsonLd";
import { getOrganizationSchema } from "@/lib/structured-data";

// Full-bleed marketing shell (no app sidebar) for the public front door.
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <JsonLd data={getOrganizationSchema()} />
      <MarketingNav session={session} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
