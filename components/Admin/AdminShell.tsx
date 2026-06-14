"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  FlagIcon,
  UsersIcon,
  RssIcon,
  TagIcon,
  RectangleStackIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface AdminUser {
  name?: string | null;
  image?: string | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Planned surface that doesn't exist yet — rendered disabled with a badge. */
  soon?: boolean;
}

// Sidebar sections. `soon` items are Phase 2/3 surfaces (see
// docs/plans/2026-06-14-admin-shell-and-ai-content-design.md) — shown as the
// roadmap but not linked until their routes exist.
const NAV: NavItem[] = [
  { name: "Overview", href: "/admin", icon: Squares2X2Icon },
  { name: "Moderation", href: "/admin/moderation", icon: FlagIcon },
  { name: "Users", href: "/admin/users", icon: UsersIcon },
  { name: "Sources", href: "/admin/sources", icon: RssIcon },
  { name: "Tags", href: "/admin/tags", icon: TagIcon },
  {
    name: "Content",
    href: "/admin/content",
    icon: RectangleStackIcon,
    soon: true,
  },
  { name: "Insights", href: "/admin/insights", icon: ChartBarIcon, soon: true },
];

/**
 * The private admin cockpit shell: a persistent left sidebar + slim top bar +
 * full-width fluid content area. Lives in the `(admin)` route group so it is
 * fully outside the public `AppShell` rails. Reuses the Codú design tokens.
 */
export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AdminUser;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);

  return (
    <div className="flex min-h-svh bg-canvas text-fg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-hairline bg-surface md:flex">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="font-display text-lg font-extrabold tracking-tight text-fg">
            Codú
          </span>
          <span className="rounded-sm border border-hairline px-1.5 py-px font-mono text-[10px] uppercase tracking-label text-faint">
            Admin
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={!!isActive(item.href)}
            />
          ))}
        </nav>
        <Link
          href="/"
          className="flex items-center gap-2 border-t border-hairline px-4 py-3 text-sm text-muted transition-colors hover:text-fg"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to site
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-canvas/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="font-display text-base font-extrabold tracking-tight text-fg">
              Codú
            </span>
            <span className="rounded-sm border border-hairline px-1.5 py-px font-mono text-[10px] uppercase tracking-label text-faint">
              Admin
            </span>
          </div>
          <p className="hidden font-mono text-xs uppercase tracking-label text-faint md:block">
            {"// "}admin
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-sm text-muted transition-colors hover:text-fg sm:block md:hidden"
            >
              Back to site
            </Link>
            <Avatar name={user.name} image={user.image} />
          </div>
        </header>

        {/* Mobile horizontal nav (sidebar is hidden < md) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-surface px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <MobileNavLink
              key={item.name}
              item={item}
              active={!!isActive(item.href)}
            />
          ))}
        </nav>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const base =
    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-base ease-out";

  if (item.soon) {
    return (
      <span
        className={`${base} cursor-default font-medium text-faint`}
        aria-disabled="true"
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{item.name}</span>
        <span className="rounded-sm border border-hairline px-1 py-px font-mono text-[9px] uppercase tracking-label text-faint">
          Soon
        </span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${base} ${
        active
          ? "bg-elevated font-semibold text-fg"
          : "font-medium text-muted hover:bg-elevated hover:text-fg"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
      {item.name}
    </Link>
  );
}

function MobileNavLink({ item, active }: { item: NavItem; active: boolean }) {
  if (item.soon) {
    return (
      <span className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-faint">
        {item.name}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
        active
          ? "bg-elevated font-semibold text-fg"
          : "font-medium text-muted hover:bg-elevated hover:text-fg"
      }`}
    >
      {item.name}
    </Link>
  );
}

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={`${name ?? "Your"} avatar`}
        className="h-8 w-8 rounded-full object-cover ring-2 ring-hairline"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-on-accent">
      {name?.[0]?.toUpperCase() || "C"}
    </span>
  );
}
