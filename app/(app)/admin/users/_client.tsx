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
import { getRelativeTime } from "@/utils/relativeTime";

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
    <div className="mx-auto max-w-6xl px-0 py-4 sm:px-4 sm:py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-elevated hover:text-fg"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-fg">
            User Management
          </h1>
          <p className="mt-1 text-muted">Search and manage platform users</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Search by username, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-hairline bg-transparent py-2 pl-10 pr-4 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <button
          onClick={() => setShowBannedOnly(!showBannedOnly)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 font-mono text-sm uppercase tracking-label transition-colors ${
            showBannedOnly
              ? "bg-danger/12 text-danger"
              : "border border-hairline text-muted hover:bg-elevated hover:text-fg"
          }`}
        >
          <ShieldExclamationIcon className="h-4 w-4" />
          {showBannedOnly ? "Showing Banned Only" : "Show Banned Only"}
        </button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-hairline bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-elevated" />
                  <div>
                    <div className="mb-1 h-4 w-32 rounded bg-elevated" />
                    <div className="h-3 w-48 rounded bg-elevated" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && displayUsers?.length === 0 && (
          <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
            <h3 className="font-display text-lg font-semibold text-fg">
              No users found
            </h3>
            <p className="mt-2 text-muted">
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
            className="rounded-lg border border-hairline bg-surface p-4"
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
                      className="font-medium text-fg hover:underline"
                    >
                      {user.name || user.username}
                    </Link>
                    {"role" in user && user.role === "ADMIN" && (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-xs uppercase tracking-label text-accent">
                        Admin
                      </span>
                    )}
                    {"isBanned" in user && user.isBanned && (
                      <span className="bg-danger/12 rounded px-1.5 py-0.5 font-mono text-xs uppercase tracking-label text-danger">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
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
                    className="secondary-button px-3 py-1.5 text-sm text-success disabled:opacity-50"
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
                        className="w-48 rounded-md border border-hairline bg-transparent px-2 py-1 text-sm text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        onClick={() => handleBan(user.id)}
                        disabled={isBanning}
                        className="secondary-button px-3 py-1.5 text-sm text-danger disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUserId(null);
                          setBanNote("");
                        }}
                        className="secondary-button px-3 py-1.5 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="secondary-button px-3 py-1.5 text-sm text-danger"
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
              <div className="bg-danger/8 mt-3 rounded border-l-4 border-danger p-2">
                <p className="text-sm text-danger">
                  <span className="font-medium">Ban reason:</span>{" "}
                  {user.banNote}
                </p>
                {"bannedBy" in user && user.bannedBy && (
                  <p className="font-mono text-xs text-danger">
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
