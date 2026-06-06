"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const UserManagement = () => {
  const searchParams = useSearchParams();
  const initialFilter = searchParams?.get("filter");
  const [search, setSearch] = useState("");
  const [showBannedOnly, setShowBannedOnly] = useState(
    initialFilter === "banned",
  );
  const [banNote, setBanNote] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data: usersData, isLoading } = api.admin.getUsers.useQuery({
    search: search || undefined,
    limit: 20,
  });

  const { data: bannedUsers } = api.admin.getBannedUsers.useQuery(undefined, {
    enabled: showBannedOnly,
  });

  const { mutate: banUser, isPending: isBanning } = api.admin.ban.useMutation({
    onSuccess: () => {
      toast.success("User banned successfully");
      utils.admin.getUsers.invalidate();
      utils.admin.getBannedUsers.invalidate();
      setSelectedUserId(null);
      setBanNote("");
    },
    onError: () => {
      toast.error("Failed to ban user");
    },
  });

  const { mutate: unbanUser, isPending: isUnbanning } =
    api.admin.unban.useMutation({
      onSuccess: () => {
        toast.success("User unbanned successfully");
        utils.admin.getUsers.invalidate();
        utils.admin.getBannedUsers.invalidate();
      },
      onError: () => {
        toast.error("Failed to unban user");
      },
    });

  const handleBan = (userId: string) => {
    if (!banNote.trim()) {
      toast.error("Please provide a reason for the ban");
      return;
    }
    banUser({ userId, note: banNote });
  };

  const handleUnban = (userId: string) => {
    unbanUser({ userId });
  };

  const getRelativeTime = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 1) return "today";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const displayUsers = showBannedOnly
    ? bannedUsers?.map((b) => ({
        ...b.user,
        isBanned: true,
        bannedAt: b.createdAt,
        banNote: b.note,
        bannedBy: b.bannedBy,
      }))
    : usersData?.users;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Search and manage platform users
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-neutral-900 placeholder-neutral-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
          />
        </div>

        <button
          onClick={() => setShowBannedOnly(!showBannedOnly)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            showBannedOnly
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          }`}
        >
          <ShieldExclamationIcon className="h-4 w-4" />
          {showBannedOnly ? "Showing Banned Only" : "Show Banned Only"}
        </button>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div>
                    <div className="mb-1 h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayUsers?.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              {search
                ? "Try a different search term"
                : showBannedOnly
                  ? "No banned users"
                  : "No users yet"}
            </p>
          </div>
        )}

        {displayUsers?.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.image || "/images/person.png"}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${user.username}`}
                      className="font-medium text-neutral-900 hover:underline dark:text-white"
                    >
                      {user.name || user.username}
                    </Link>
                    {"role" in user && user.role === "ADMIN" && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Admin
                      </span>
                    )}
                    {"isBanned" in user && user.isBanned && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    @{user.username} · {user.email}
                    {"createdAt" in user && user.createdAt && (
                      <> · Joined {getRelativeTime(user.createdAt)}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {"isBanned" in user && user.isBanned ? (
                  <button
                    onClick={() => handleUnban(user.id)}
                    disabled={isUnbanning}
                    className="flex items-center gap-1 rounded-lg border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Unban
                  </button>
                ) : !("role" in user) || user.role !== "ADMIN" ? (
                  selectedUserId === user.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason for ban..."
                        value={banNote}
                        onChange={(e) => setBanNote(e.target.value)}
                        className="w-48 rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700"
                      />
                      <button
                        onClick={() => handleBan(user.id)}
                        disabled={isBanning}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserId(null);
                          setBanNote("");
                        }}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <ShieldExclamationIcon className="h-4 w-4" />
                      Ban
                    </button>
                  )
                ) : null}
              </div>
            </div>

            {/* Ban details if banned */}
            {"banNote" in user && user.banNote && (
              <div className="mt-3 rounded border-l-4 border-red-400 bg-red-50 p-2 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Ban reason:</span>{" "}
                  {user.banNote}
                </p>
                {"bannedBy" in user && user.bannedBy && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Banned by @{user.bannedBy.username}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
