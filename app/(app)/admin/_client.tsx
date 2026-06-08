"use client";

import Link from "next/link";
import {
  UsersIcon,
  DocumentTextIcon,
  FlagIcon,
  RssIcon,
  ShieldExclamationIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";

type StatTone =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneClasses: Record<StatTone, string> = {
  accent: "bg-accent/10 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  neutral: "border border-hairline text-muted",
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  href,
  tone = "info",
  isLoading,
}: {
  title: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  tone?: StatTone;
  isLoading?: boolean;
}) => {
  const content = (
    <div className="rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-strong">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-label text-faint">
            {title}
          </p>
          <p className="font-display text-2xl font-extrabold tracking-tight text-fg">
            {isLoading ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded bg-elevated" />
            ) : (
              (value ?? 0)
            )}
          </p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

const AdminDashboard = () => {
  const { data: stats, isLoading } = api.admin.getStats.useQuery();
  const { data: reportCounts } = api.report.getCounts.useQuery();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="eyebrow">
          <span className="slash">{"// "}</span>admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-muted">Manage and monitor the Codú platform</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={UsersIcon}
          tone="info"
          href="/admin/users"
          isLoading={isLoading}
        />
        <StatCard
          title="Published Posts"
          value={stats?.publishedPosts}
          icon={DocumentTextIcon}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Feed Sources"
          value={stats?.activeFeedSources}
          icon={RssIcon}
          tone="accent"
          href="/admin/sources"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Reports"
          value={reportCounts?.total}
          icon={FlagIcon}
          tone="neutral"
          href="/admin/moderation"
          isLoading={isLoading}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-fg">
          Moderation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Reports"
            value={reportCounts?.pending}
            icon={FlagIcon}
            tone="warning"
            href="/admin/moderation"
            isLoading={isLoading}
          />
          <StatCard
            title="Actioned Reports"
            value={reportCounts?.actioned}
            icon={ShieldExclamationIcon}
            tone="danger"
            isLoading={isLoading}
          />
          <StatCard
            title="Banned Users"
            value={stats?.bannedUsers}
            icon={ShieldExclamationIcon}
            tone="danger"
            href="/admin/users?filter=banned"
            isLoading={isLoading}
          />
          <StatCard
            title="Dismissed Reports"
            value={reportCounts?.dismissed}
            icon={FlagIcon}
            tone="success"
            isLoading={isLoading}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 font-display text-xl font-extrabold tracking-tight text-fg">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/moderation"
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent hover:bg-accent/10"
          >
            <FlagIcon className="h-6 w-6 text-accent" />
            <div>
              <p className="font-display font-semibold text-fg">
                Moderation Queue
              </p>
              <p className="text-sm text-muted">Review reported content</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent hover:bg-accent/10"
          >
            <UsersIcon className="h-6 w-6 text-info" />
            <div>
              <p className="font-display font-semibold text-fg">
                User Management
              </p>
              <p className="text-sm text-muted">Search and manage users</p>
            </div>
          </Link>

          <Link
            href="/admin/sources"
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent hover:bg-accent/10"
          >
            <RssIcon className="h-6 w-6 text-accent" />
            <div>
              <p className="font-display font-semibold text-fg">Feed Sources</p>
              <p className="text-sm text-muted">Manage RSS feed sources</p>
            </div>
          </Link>

          <Link
            href="/admin/tags"
            className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent hover:bg-accent/10"
          >
            <TagIcon className="h-6 w-6 text-success" />
            <div>
              <p className="font-display font-semibold text-fg">
                Tag Management
              </p>
              <p className="text-sm text-muted">
                Merge, curate, and manage tags
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
