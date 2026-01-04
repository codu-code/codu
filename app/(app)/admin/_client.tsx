"use client";

import Link from "next/link";
import {
  UsersIcon,
  DocumentTextIcon,
  FlagIcon,
  RssIcon,
  ShieldExclamationIcon,
  NewspaperIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";

const AdminDashboard = () => {
  const { data: stats, isLoading } = api.admin.getStats.useQuery();
  const { data: reportCounts } = api.report.getCounts.useQuery();

  const StatCard = ({
    title,
    value,
    icon: Icon,
    href,
    color = "blue",
  }: {
    title: string;
    value: number | undefined;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      green:
        "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      yellow:
        "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      purple:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      orange:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    };

    const content = (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isLoading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              ) : (
                value ?? 0
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Manage and monitor the Codú platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          icon={UsersIcon}
          color="blue"
          href="/admin/users"
        />
        <StatCard
          title="Published Posts"
          value={stats?.publishedPosts}
          icon={DocumentTextIcon}
          color="green"
        />
        <StatCard
          title="Aggregated Articles"
          value={stats?.aggregatedArticles}
          icon={NewspaperIcon}
          color="purple"
        />
        <StatCard
          title="Active Feed Sources"
          value={stats?.activeFeedSources}
          icon={RssIcon}
          color="orange"
          href="/admin/sources"
        />
      </div>

      {/* Moderation Stats */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
          Moderation
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Reports"
            value={reportCounts?.pending}
            icon={FlagIcon}
            color="yellow"
            href="/admin/moderation"
          />
          <StatCard
            title="Actioned Reports"
            value={reportCounts?.actioned}
            icon={ShieldExclamationIcon}
            color="red"
          />
          <StatCard
            title="Banned Users"
            value={stats?.bannedUsers}
            icon={ShieldExclamationIcon}
            color="red"
            href="/admin/users?filter=banned"
          />
          <StatCard
            title="Dismissed Reports"
            value={reportCounts?.dismissed}
            icon={FlagIcon}
            color="green"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/moderation"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-orange-300 hover:bg-orange-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-orange-700 dark:hover:bg-orange-900/20"
          >
            <FlagIcon className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                Moderation Queue
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Review reported content
              </p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
          >
            <UsersIcon className="h-6 w-6 text-blue-500" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                User Management
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Search and manage users
              </p>
            </div>
          </Link>

          <Link
            href="/admin/sources"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-purple-300 hover:bg-purple-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-purple-700 dark:hover:bg-purple-900/20"
          >
            <RssIcon className="h-6 w-6 text-purple-500" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">
                Feed Sources
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Manage RSS feed sources
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
