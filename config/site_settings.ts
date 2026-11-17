// Sitewide footer links — point at canonical 200 URLs, not redirecting legacy
// paths (/articles and /feed both 308 now).
export const footerNav = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Articles", href: "/?type=article" },
  { name: "Discussions", href: "/discussions" },
  { name: "Events", href: "https://www.meetup.com/codu-community/" },
  { name: "Advertise", href: "/advertise" },
  { name: "Code Of Conduct", href: "/code-of-conduct" },
  { name: "Privacy Policy", href: "/privacy" },
];

export const navigation = [
  { name: "Articles", href: "/?type=article" },
  { name: "Discussions", href: "/discussions" },
  { name: "Events", href: "https://www.meetup.com/codu-community/" },
  { name: "About", href: "/about" },
];

export const discordInviteUrl = "https://discord.gg/NxSkYtZ";
export const githubUrl = "https://github.com/codu-code/codu";
export const twitterUrl = "https://twitter.com/coducommunity";
export const youtubeUrl = "https://www.youtube.com/c/Cod%C3%BACommunity";
export const linkedinUrl = "https://www.linkedin.com/company/codu-community";

// Sidebar navigation configuration
export const sidebarNavigation = [
  { name: "Home", href: "/", icon: "HomeIcon" },
  { name: "Feed", href: "/feed", icon: "NewspaperIcon" },
  {
    name: "Events",
    href: "https://www.meetup.com/codu-community/",
    icon: "CalendarIcon",
    external: true,
  },
  { name: "Jobs", href: "/jobs", icon: "BriefcaseIcon" },
  { name: "About", href: "/about", icon: "InformationCircleIcon" },
] as const;

export const sidebarUserNavigation = [
  { name: "Your Profile", href: "/profile", icon: "UserIcon", dynamic: true },
  { name: "Your Posts", href: "/my-posts", icon: "DocumentTextIcon" },
  { name: "Saved", href: "/saved", icon: "BookmarkIcon" },
  { name: "Settings", href: "/settings", icon: "Cog6ToothIcon" },
] as const;

export const sidebarFooterNav = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Code Of Conduct", href: "/code-of-conduct" },
  { name: "Advertise", href: "/advertise" },
] as const;

export const socialLinks = [
  { name: "Discord", href: discordInviteUrl, icon: "discord" },
  { name: "GitHub", href: githubUrl, icon: "github" },
  { name: "Twitter", href: twitterUrl, icon: "twitter" },
  { name: "YouTube", href: youtubeUrl, icon: "youtube" },
] as const;
