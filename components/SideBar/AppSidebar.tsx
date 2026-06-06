"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import {
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarLabel,
  SidebarDivider,
  SidebarHeading,
  SidebarSpacer,
} from "@/components/ui-components/sidebar";
import {
  sidebarNavigation,
  sidebarUserNavigation,
  sidebarFooterNav,
  githubUrl,
  twitterUrl,
  linkedinUrl,
} from "@/config/site_settings";
import { useSidebar } from "@/context/SidebarContext";
import { FEATURE_FLAGS, isFlagEnabled } from "@/utils/flags";
import Twitter from "@/icons/x.svg";
import Github from "@/icons/github.svg";
import Linkedin from "@/icons/linkedin.svg";

const iconMap = {
  HomeIcon,
  NewspaperIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  BriefcaseIcon,
};

const socialLinks = [
  {
    name: "Twitter",
    href: twitterUrl,
    Icon: Twitter,
    customStyle: "hover:bg-twitter focus:bg-twitter",
  },
  {
    name: "GitHub",
    href: githubUrl,
    Icon: Github,
    customStyle: "hover:bg-github focus:bg-github",
  },
  {
    name: "LinkedIn",
    href: linkedinUrl,
    Icon: Linkedin,
    customStyle: "hover:bg-[#0A66C2] focus:bg-[#0A66C2]",
  },
];

interface AppSidebarProps {
  session: Session | null;
  username: string | null;
}

export function AppSidebar({ session, username }: AppSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // Jobs is flag-gated until launch (auto-on in dev).
  const jobsEnabled = isFlagEnabled(FEATURE_FLAGS.JOBS);
  const navItems = sidebarNavigation.filter(
    (item) => item.href !== "/jobs" || jobsEnabled,
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getUserNavHref = (href: string, dynamic?: boolean) => {
    if (dynamic && username) {
      return `/${username}`;
    }
    return href;
  };

  return (
    <Sidebar className="bg-neutral-100 dark:bg-black">
      <SidebarBody>
        <SidebarSection>
          {navItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <SidebarItem
                key={item.name}
                href={item.href}
                current={isActive(item.href)}
              >
                {Icon && (
                  <Icon
                    className={`!size-5 shrink-0 ${isActive(item.href) ? "text-neutral-800 dark:text-white" : "text-neutral-400"}`}
                  />
                )}
                <SidebarLabel
                  className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
                >
                  {item.name}
                </SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        {session && (
          <>
            <SidebarDivider />
            <SidebarSection>
              <SidebarHeading
                className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
              >
                Account
              </SidebarHeading>
              {sidebarUserNavigation.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const href = getUserNavHref(
                  item.href,
                  "dynamic" in item ? item.dynamic : false,
                );
                return (
                  <SidebarItem
                    key={item.name}
                    href={href}
                    current={isActive(href)}
                  >
                    {Icon && (
                      <Icon
                        className={`!size-5 shrink-0 ${isActive(href) ? "text-neutral-800 dark:text-white" : "text-neutral-400"}`}
                      />
                    )}
                    <SidebarLabel
                      className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
                    >
                      {item.name}
                    </SidebarLabel>
                  </SidebarItem>
                );
              })}
            </SidebarSection>
          </>
        )}

        <SidebarSpacer />

        <SidebarSection
          className={`transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
        >
          {sidebarFooterNav.map((item) => (
            <SidebarItem key={item.name} href={item.href}>
              <SidebarLabel className="text-xs text-neutral-500 dark:text-neutral-400">
                {item.name}
              </SidebarLabel>
            </SidebarItem>
          ))}
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter
        className={`border-t-0 transition-opacity duration-300 ${isCollapsed ? "opacity-0" : "opacity-100"}`}
      >
        <div className="flex items-center justify-center gap-4 py-2">
          {socialLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`focus-style rounded-md p-1 text-neutral-400 transition-all duration-300 hover:scale-105 hover:text-white hover:brightness-110 focus:scale-105 focus:text-white focus:brightness-110 ${item.customStyle.toLowerCase()}`}
            >
              <span className="sr-only">{item.name}</span>
              <item.Icon className="h-5 w-5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
