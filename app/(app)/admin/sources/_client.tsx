"use client";

import { useState } from "react";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/20/solid";

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PAUSED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusIcons = {
  ACTIVE: CheckCircleIcon,
  PAUSED: PauseCircleIcon,
  ERROR: XCircleIcon,
};

const AdminSourcesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    websiteUrl: "",
    logoUrl: "",
    category: "",
  });

  const utils = api.useUtils();

  // Sync all sources
  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const response = await fetch("/api/admin/sync-feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `Synced ${data.stats.sourcesProcessed} sources. Added ${data.stats.articlesAdded} articles.`,
        );
        if (data.stats.errors.length > 0) {
          toast.error(`${data.stats.errors.length} sources had errors`);
        }
        refetch();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to sync feeds");
    } finally {
      setSyncingAll(false);
    }
  };

  // Sync single source
  const handleSyncSource = async (sourceId: number, sourceName: string) => {
    setSyncingSourceId(sourceId);
    try {
      const response = await fetch("/api/admin/sync-feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `${sourceName}: Added ${data.stats.articlesAdded} articles`,
        );
        refetch();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error(`Failed to sync ${sourceName}`);
    } finally {
      setSyncingSourceId(null);
    }
  };

  // Fetch sources with stats
  const { data: sources, status, refetch } = api.feed.getSourceStats.useQuery();

  // Mutations
  const createSource = api.feed.createSource.useMutation({
    onSuccess: () => {
      toast.success("Feed source added successfully");
      setShowAddForm(false);
      setFormData({
        name: "",
        url: "",
        websiteUrl: "",
        logoUrl: "",
        category: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add feed source");
    },
  });

  const updateSource = api.feed.updateSource.useMutation({
    onSuccess: () => {
      toast.success("Feed source updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update feed source");
    },
  });

  const deleteSource = api.feed.deleteSource.useMutation({
    onSuccess: () => {
      toast.success("Feed source deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete feed source");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSource.mutate({
      name: formData.name,
      url: formData.url,
      websiteUrl: formData.websiteUrl || undefined,
      logoUrl: formData.logoUrl || undefined,
      category: formData.category || undefined,
    });
  };

  const handleStatusToggle = (id: number, currentStatus: string) => {
    // Status is now lowercase in the new schema, but UpdateFeedSourceSchema still expects uppercase
    const newStatus = currentStatus === "active" ? "PAUSED" : "ACTIVE";
    updateSource.mutate({
      id,
      status: newStatus as "ACTIVE" | "PAUSED" | "ERROR",
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will also delete all associated articles.`,
      )
    ) {
      deleteSource.mutate({ id });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Feed Sources
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage RSS feed sources for the content aggregator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <CloudArrowDownIcon
              className={`h-5 w-5 ${syncingAll ? "animate-pulse" : ""}`}
            />
            {syncingAll ? "Syncing..." : "Sync All"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <PlusIcon className="h-5 w-5" />
            Add Source
          </button>
        </div>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Add New Feed Source
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                placeholder="e.g., Josh Comeau's Blog"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                RSS Feed URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                placeholder="https://example.com/rss.xml"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                placeholder="e.g., frontend, react, career"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={createSource.status === "pending"}
                className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                {createSource.status === "pending" ? "Adding..." : "Add Source"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sources Table */}
      {status === "pending" && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Failed to load feed sources. Please refresh the page.
        </div>
      )}

      {status === "success" && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Last Fetched
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Errors
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-900">
              {sources?.map((source) => {
                const StatusIcon =
                  statusIcons[source.status as keyof typeof statusIcons];
                return (
                  <tr key={source.sourceId}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {source.sourceName}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {/* Category would need to be fetched separately or added to stats */}
                      -
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[
                            source.status as keyof typeof statusColors
                          ]
                        }`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {source.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {source.articleCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {source.lastFetchedAt
                        ? new Date(source.lastFetchedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                      {source.errorCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleSyncSource(source.sourceId, source.sourceName)
                          }
                          disabled={syncingSourceId === source.sourceId}
                          className="rounded p-1 text-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:hover:bg-blue-950"
                          title="Sync now"
                        >
                          <ArrowPathIcon
                            className={`h-5 w-5 ${syncingSourceId === source.sourceId ? "animate-spin" : ""}`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            handleStatusToggle(source.sourceId, source.status)
                          }
                          className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                          title={
                            source.status === "active" ? "Pause" : "Activate"
                          }
                        >
                          {source.status === "active" ? (
                            <PauseCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(source.sourceId, source.sourceName)
                          }
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sources?.length === 0 && (
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
              No feed sources yet. Add your first source above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSourcesPage;
