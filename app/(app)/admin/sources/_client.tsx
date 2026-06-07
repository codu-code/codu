"use client";

import { useState, useRef } from "react";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import { uploadFile } from "@/utils/s3helpers";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  PencilSquareIcon,
  XMarkIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";

const statusColors = {
  active: "bg-success/12 text-success",
  paused: "bg-warning/12 text-warning",
  error: "bg-danger/12 text-danger",
};

const statusIcons = {
  active: CheckCircleIcon,
  paused: PauseCircleIcon,
  error: XCircleIcon,
};

// Component for logo with fallback
const LogoWithFallback = ({
  logoUrl,
  name,
  size = "sm",
}: {
  logoUrl: string | null;
  name: string;
  size?: "sm" | "md";
}) => {
  const [imageError, setImageError] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = size === "md" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "md" ? "text-base" : "text-sm";

  // If we have a logoUrl and it hasn't errored, show the image
  if (logoUrl && !imageError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={`${sizeClass} flex-shrink-0 rounded object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to initial letter
  return (
    <span
      className={`flex ${sizeClass} flex-shrink-0 items-center justify-center rounded bg-accent ${textSize} font-medium text-on-accent`}
    >
      {initial}
    </span>
  );
};

// Helper to check which fields are missing for data completeness
const getMissingFields = (source: {
  logoUrl: string | null;
  websiteUrl: string | null;
  category: string | null;
  description: string | null;
}): string[] => {
  const missing: string[] = [];
  if (!source.logoUrl) missing.push("Logo");
  if (!source.websiteUrl) missing.push("Website URL");
  if (!source.category) missing.push("Category");
  if (!source.description) missing.push("Description");
  return missing;
};

// Data completeness badge component
const DataCompletenessBadge = ({
  missingFields,
}: {
  missingFields: string[];
}) => {
  if (missingFields.length === 0) return null;

  return (
    <span className="group relative ml-1.5 inline-flex">
      <ExclamationTriangleIcon className="h-4 w-4 text-warning" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-hairline bg-elevated px-2 py-1 font-mono text-xs text-fg opacity-0 transition-opacity group-hover:opacity-100">
        Missing: {missingFields.join(", ")}
      </span>
    </span>
  );
};

const AdminSourcesPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSourceId, setSyncingSourceId] = useState<number | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingSource, setEditingSource] = useState<{
    id: number;
    name: string;
    url: string;
    websiteUrl: string;
    logoUrl: string;
    category: string;
    description: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    websiteUrl: "",
    logoUrl: "",
    category: "",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

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
      setEditingSource(null);
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

  const { mutate: getUploadUrl } = api.feed.getSourceUploadUrl.useMutation();

  // Handle logo image upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingSource)
      return;

    const file = e.target.files[0];
    const { size, type } = file;

    setUploadingLogo(true);

    await getUploadUrl(
      { size, type },
      {
        onError(error) {
          setUploadingLogo(false);
          if (error) return toast.error(error.message);
          return toast.error("Failed to upload logo, please try again.");
        },
        async onSuccess(signedUrl) {
          try {
            const response = await uploadFile(signedUrl, file);
            const { fileLocation } = response;
            setEditingSource({
              ...editingSource,
              logoUrl: fileLocation,
            });
            toast.success("Logo uploaded successfully");
          } catch {
            toast.error("Failed to upload logo, please try again.");
          } finally {
            setUploadingLogo(false);
          }
        },
      },
    );

    // Reset the input so the same file can be selected again
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    updateSource.mutate({
      id: editingSource.id,
      name: editingSource.name,
      websiteUrl: editingSource.websiteUrl || undefined,
      logoUrl: editingSource.logoUrl || undefined,
      category: editingSource.category || undefined,
      description: editingSource.description || undefined,
    });
  };

  const handleStatusToggle = (id: number, currentStatus: string) => {
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

  const openEditModal = (source: {
    sourceId: number;
    sourceName: string;
    url: string | null;
    websiteUrl: string | null;
    logoUrl: string | null;
    category: string | null;
    description: string | null;
  }) => {
    setEditingSource({
      id: source.sourceId,
      name: source.sourceName,
      url: source.url || "",
      websiteUrl: source.websiteUrl || "",
      logoUrl: source.logoUrl || "",
      category: source.category || "",
      description: source.description || "",
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-fg">
            Feed Sources
          </h1>
          <p className="mt-1 text-muted">
            Manage RSS feed sources for the content aggregator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="secondary-button disabled:opacity-50"
          >
            <CloudArrowDownIcon
              className={`h-5 w-5 ${syncingAll ? "animate-pulse" : ""}`}
            />
            {syncingAll ? "Syncing..." : "Sync All"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="primary-button"
          >
            <PlusIcon className="h-5 w-5" />
            Add Source
          </button>
        </div>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="mb-8 rounded-lg border border-hairline bg-surface p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-fg">
            Add New Feed Source
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="e.g., Josh Comeau's Blog"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                RSS Feed URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
                className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="https://example.com/rss.xml"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
                className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="e.g., frontend, react, career"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={createSource.status === "pending"}
                className="primary-button disabled:opacity-50"
              >
                {createSource.status === "pending" ? "Adding..." : "Add Source"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="secondary-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-hairline bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-fg">
                Edit Feed Source
              </h2>
              <button
                onClick={() => setEditingSource(null)}
                className="rounded p-1 text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Name
                </label>
                <input
                  type="text"
                  value={editingSource.name}
                  onChange={(e) =>
                    setEditingSource({ ...editingSource, name: e.target.value })
                  }
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  RSS Feed URL (read-only)
                </label>
                <input
                  type="url"
                  value={editingSource.url}
                  readOnly
                  className="w-full rounded-md border border-hairline bg-inset px-3 py-2 text-faint"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Website URL
                </label>
                <input
                  type="url"
                  value={editingSource.websiteUrl}
                  onChange={(e) =>
                    setEditingSource({
                      ...editingSource,
                      websiteUrl: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Logo
                </label>
                <div className="flex items-start gap-4">
                  {/* Logo preview */}
                  <div className="flex-shrink-0">
                    {editingSource.logoUrl ? (
                      <img
                        src={editingSource.logoUrl}
                        alt={`${editingSource.name} logo`}
                        className="h-16 w-16 rounded-lg border border-hairline object-cover"
                        onError={(e) => {
                          // Hide broken images
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-hairline bg-inset">
                        <PhotoIcon className="h-8 w-8 text-faint" />
                      </div>
                    )}
                  </div>
                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="secondary-button px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {uploadingLogo ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <PhotoIcon className="h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </button>
                    <p className="font-mono text-xs text-faint">
                      PNG, JPG, GIF or WEBP. Max 5MB.
                    </p>
                    {/* URL input as fallback */}
                    <input
                      type="url"
                      value={editingSource.logoUrl}
                      onChange={(e) =>
                        setEditingSource({
                          ...editingSource,
                          logoUrl: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-sm text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Or paste image URL..."
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Category
                </label>
                <input
                  type="text"
                  value={editingSource.category}
                  onChange={(e) =>
                    setEditingSource({
                      ...editingSource,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="e.g., frontend, react, career"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Description
                </label>
                <textarea
                  value={editingSource.description}
                  onChange={(e) =>
                    setEditingSource({
                      ...editingSource,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="A brief description of this feed source..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSource(null)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSource.status === "pending"}
                  className="primary-button disabled:opacity-50"
                >
                  {updateSource.status === "pending"
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sources Table */}
      {status === "pending" && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-faint" />
        </div>
      )}

      {status === "error" && (
        <div className="bg-danger/8 rounded-lg border border-danger/40 p-4 text-danger">
          Failed to load feed sources. Please refresh the page.
        </div>
      )}

      {status === "success" && (
        <div className="overflow-hidden rounded-lg border border-hairline">
          <table className="min-w-full divide-y divide-hairline">
            <thead className="bg-elevated">
              <tr>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Source
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Category
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Articles
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Last Fetched
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Errors
                </th>
                <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-label text-faint">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-surface">
              {sources?.map((source) => {
                const StatusIcon =
                  statusIcons[source.status as keyof typeof statusIcons];
                return (
                  <tr
                    key={source.sourceId}
                    className="transition-colors hover:bg-elevated"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-3">
                        <LogoWithFallback
                          logoUrl={source.logoUrl}
                          name={source.sourceName}
                        />
                        <span>
                          <span className="flex items-center font-medium text-fg">
                            {source.sourceName}
                            <DataCompletenessBadge
                              missingFields={getMissingFields(source)}
                            />
                          </span>
                          {source.websiteUrl && (
                            <span className="block font-mono text-xs text-faint">
                              {(() => {
                                try {
                                  return new URL(source.websiteUrl).hostname;
                                } catch {
                                  return "";
                                }
                              })()}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted">
                      {source.category || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-label ${
                          statusColors[
                            source.status as keyof typeof statusColors
                          ]
                        }`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {source.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-muted">
                      {source.articleCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-faint">
                      {source.lastFetchedAt
                        ? new Date(source.lastFetchedAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-muted">
                      {source.errorCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(source)}
                          className="rounded bg-transparent p-1.5 text-muted transition-colors hover:bg-elevated hover:text-fg"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleSyncSource(source.sourceId, source.sourceName)
                          }
                          disabled={syncingSourceId === source.sourceId}
                          className="rounded bg-transparent p-1.5 text-muted transition-colors hover:bg-elevated hover:text-fg disabled:opacity-50"
                          title="Sync now"
                        >
                          <ArrowPathIcon
                            className={`h-4 w-4 ${syncingSourceId === source.sourceId ? "animate-spin" : ""}`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            handleStatusToggle(source.sourceId, source.status)
                          }
                          className="rounded bg-transparent p-1.5 text-muted transition-colors hover:bg-elevated hover:text-fg"
                          title={
                            source.status === "active" ? "Pause" : "Activate"
                          }
                        >
                          {source.status === "active" ? (
                            <PauseCircleIcon className="h-4 w-4" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(source.sourceId, source.sourceName)
                          }
                          className="hover:bg-danger/12 rounded bg-transparent p-1.5 text-danger transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sources?.length === 0 && (
            <div className="py-12 text-center text-muted">
              No feed sources yet. Add your first source above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSourcesPage;
