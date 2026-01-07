"use client";

import type { Session } from "next-auth";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { SidebarLayout } from "@/components/ui-components/sidebar-layout";
import { AppSidebar } from "@/components/SideBar/AppSidebar";
import { MinimalHeader } from "@/components/Header/MinimalHeader";

type AlgoliaConfig = {
  ALGOLIA_APP_ID: string;
  ALGOLIA_SEARCH_API: string;
  ALGOLIA_SOURCE_IDX: string;
};

interface SidebarAppLayoutProps {
  children: React.ReactNode;
  session: Session | null;
  algoliaSearchConfig: AlgoliaConfig;
  username: string | null;
}

function SidebarAppLayoutInner({
  children,
  session,
  algoliaSearchConfig,
  username,
}: SidebarAppLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <SidebarLayout
      isCollapsed={isCollapsed}
      sidebar={<AppSidebar session={session} username={username} />}
      navbar={
        <MinimalHeader
          session={session}
          algoliaSearchConfig={algoliaSearchConfig}
          username={username}
        />
      }
    >
      {children}
    </SidebarLayout>
  );
}

export function SidebarAppLayout(props: SidebarAppLayoutProps) {
  return (
    <SidebarProvider>
      <SidebarAppLayoutInner {...props} />
    </SidebarProvider>
  );
}
