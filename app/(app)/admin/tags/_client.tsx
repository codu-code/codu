"use client";

import { useState } from "react";
import { api } from "@/server/trpc/react";
import { toast } from "sonner";
import {
  ArrowPathIcon,
  PencilSquareIcon,
  XMarkIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";

type SortField = "postCount" | "title" | "createdAt";
type SortOrder = "asc" | "desc";

const SortIcon = ({
  field,
  sortField,
}: {
  field: SortField;
  sortField: SortField;
}) => (
  <ChevronUpDownIcon
    className={`ml-1 inline h-4 w-4 ${
      sortField === field ? "text-accent" : "text-faint"
    }`}
  />
);

const TagsAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("postCount");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [editingTag, setEditingTag] = useState<{
    id: number;
    title: string;
    slug: string;
    description: string;
    postCount: number;
  } | null>(null);
  const [mergeSource, setMergeSource] = useState<{
    id: number;
    title: string;
    postCount: number;
  } | null>(null);
  const [mergeTarget, setMergeTarget] = useState<{
    id: number;
    title: string;
    postCount: number;
  } | null>(null);
  const [showMergePanel, setShowMergePanel] = useState(false);

  // Fetch all tags with admin stats
  const { data, status, refetch } = api.tag.getAdminStats.useQuery();

  // Fetch merge suggestions
  const { data: mergeSuggestions, refetch: refetchSuggestions } =
    api.tag.getMergeSuggestions.useQuery();

  // Mutations
  const updateTag = api.tag.update.useMutation({
    onSuccess: () => {
      toast.success("Tag updated successfully");
      setEditingTag(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tag");
    },
  });

  const mergeTags = api.tag.mergeTags.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setMergeSource(null);
      setMergeTarget(null);
      setShowMergePanel(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to merge tags");
    },
  });

  const reviewSuggestion = api.tag.reviewMergeSuggestion.useMutation({
    onSuccess: () => {
      toast.success("Suggestion reviewed");
      refetchSuggestions();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to review suggestion");
    },
  });

  const recalculateCounts = api.tag.recalculateCounts.useMutation({
    onSuccess: (result) => {
      toast.success(`Recalculated counts for ${result.updated} tags`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to recalculate counts");
    },
  });

  // Filter and sort tags
  const filteredTags = data?.data
    ?.filter((tag) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        tag.title.toLowerCase().includes(query) ||
        tag.slug?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "postCount":
          comparison = a.postCount - b.postCount;
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    updateTag.mutate({
      id: editingTag.id,
      title: editingTag.title,
      slug: editingTag.slug,
      description: editingTag.description || null,
    });
  };

  const handleMerge = () => {
    if (!mergeSource || !mergeTarget) return;
    if (
      !confirm(
        `Are you sure you want to merge "${mergeSource.title}" into "${mergeTarget.title}"? This will move all ${mergeSource.postCount} posts to the target tag and delete "${mergeSource.title}".`,
      )
    ) {
      return;
    }
    mergeTags.mutate({
      sourceTagId: mergeSource.id,
      targetTagId: mergeTarget.id,
    });
  };

  const handleApproveSuggestion = (suggestion: {
    id: number;
    sourceTagId: number;
    targetTagId: number;
  }) => {
    // First approve, then merge
    reviewSuggestion.mutate(
      { suggestionId: suggestion.id, action: "approved" },
      {
        onSuccess: () => {
          mergeTags.mutate({
            sourceTagId: suggestion.sourceTagId,
            targetTagId: suggestion.targetTagId,
          });
        },
      },
    );
  };

  const handleRejectSuggestion = (suggestionId: number) => {
    reviewSuggestion.mutate({ suggestionId, action: "rejected" });
  };

  const selectForMerge = (
    tag: { id: number; title: string; postCount: number },
    type: "source" | "target",
  ) => {
    if (type === "source") {
      if (mergeTarget?.id === tag.id) setMergeTarget(null);
      setMergeSource(tag);
    } else {
      if (mergeSource?.id === tag.id) setMergeSource(null);
      setMergeTarget(tag);
    }
    setShowMergePanel(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow">
            <span className="slash">{"// "}</span>admin
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-fg">
            Tag Management
          </h1>
          <p className="mt-1 text-muted">
            Manage, merge, and curate tags across the platform
          </p>
        </div>
        <button
          onClick={() => recalculateCounts.mutate()}
          disabled={recalculateCounts.status === "pending"}
          className="secondary-button disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${recalculateCounts.status === "pending" ? "animate-spin" : ""}`}
          />
          Recalculate Counts
        </button>
      </div>

      {data?.stats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-mono text-xs uppercase tracking-label text-faint">
              Total Tags
            </p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-fg">
              {data.stats.totalTags}
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-mono text-xs uppercase tracking-label text-faint">
              Total Tagged Posts
            </p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-fg">
              {data.stats.totalPosts.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-4">
            <p className="font-mono text-xs uppercase tracking-label text-faint">
              Unused Tags
            </p>
            <p className="font-display text-2xl font-extrabold tracking-tight text-accent">
              {data.stats.tagsWithNoPosts}
            </p>
          </div>
        </div>
      )}

      {mergeSuggestions?.data && mergeSuggestions.data.length > 0 && (
        <div className="bg-warning/8 mb-6 rounded-lg border border-warning/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning" />
            <h3 className="font-display font-semibold text-warning">
              AI Merge Suggestions ({mergeSuggestions.data.length})
            </h3>
          </div>
          <div className="space-y-2">
            {mergeSuggestions.data.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between rounded-lg border border-hairline bg-surface p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-fg">
                    {suggestion.sourceTag?.title}
                  </span>
                  <span className="font-mono text-xs text-faint">
                    ({suggestion.sourceTag?.postCount} posts)
                  </span>
                  <ArrowsRightLeftIcon className="h-4 w-4 text-faint" />
                  <span className="font-medium text-fg">
                    {suggestion.targetTag?.title}
                  </span>
                  <span className="font-mono text-xs text-faint">
                    ({suggestion.targetTag?.postCount} posts)
                  </span>
                  {suggestion.reason && (
                    <span className="ml-2 text-xs text-muted">
                      - {suggestion.reason}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveSuggestion(suggestion)}
                    disabled={
                      reviewSuggestion.status === "pending" ||
                      mergeTags.status === "pending"
                    }
                    className="hover:bg-success/12 rounded p-1 text-success"
                    title="Approve & Merge"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    disabled={reviewSuggestion.status === "pending"}
                    className="hover:bg-danger/12 rounded p-1 text-danger"
                    title="Reject"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMergePanel && (
        <div className="bg-info/8 mb-6 rounded-lg border border-info/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-semibold text-info">Merge Tags</h3>
            <button
              onClick={() => {
                setShowMergePanel(false);
                setMergeSource(null);
                setMergeTarget(null);
              }}
              className="rounded p-1 text-muted transition-colors hover:bg-elevated hover:text-fg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="mb-1 font-mono text-xs uppercase tracking-label text-faint">
                Source (will be deleted)
              </p>
              <div className="rounded-lg border border-hairline bg-surface p-3">
                {mergeSource ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-fg">
                      {mergeSource.title}
                    </span>
                    <span className="font-mono text-sm text-faint">
                      {mergeSource.postCount} posts
                    </span>
                  </div>
                ) : (
                  <span className="text-faint">
                    Click a tag below to select
                  </span>
                )}
              </div>
            </div>
            <ArrowsRightLeftIcon className="h-6 w-6 text-info" />
            <div className="flex-1">
              <p className="mb-1 font-mono text-xs uppercase tracking-label text-faint">
                Target (will keep)
              </p>
              <div className="rounded-lg border border-hairline bg-surface p-3">
                {mergeTarget ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-fg">
                      {mergeTarget.title}
                    </span>
                    <span className="font-mono text-sm text-faint">
                      {mergeTarget.postCount} posts
                    </span>
                  </div>
                ) : (
                  <span className="text-faint">
                    Click a tag below to select
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleMerge}
              disabled={
                !mergeSource || !mergeTarget || mergeTags.status === "pending"
              }
              className="primary-button disabled:opacity-50"
            >
              {mergeTags.status === "pending" ? "Merging..." : "Merge"}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full rounded-md border border-hairline bg-transparent py-2 pl-10 pr-4 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => setShowMergePanel(!showMergePanel)}
          className={showMergePanel ? "primary-button" : "secondary-button"}
        >
          <ArrowsRightLeftIcon className="h-5 w-5" />
          Merge Mode
        </button>
      </div>

      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg border border-hairline bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-fg">
                Edit Tag
              </h2>
              <button
                onClick={() => setEditingTag(null)}
                className="rounded p-1 text-muted transition-colors hover:bg-elevated hover:text-fg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Title
                </label>
                <input
                  type="text"
                  value={editingTag.title}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, title: e.target.value })
                  }
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Slug
                </label>
                <input
                  type="text"
                  value={editingTag.slug}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, slug: e.target.value })
                  }
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-xs uppercase tracking-label text-faint">
                  Description
                </label>
                <textarea
                  value={editingTag.description}
                  onChange={(e) =>
                    setEditingTag({
                      ...editingTag,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-hairline bg-transparent px-3 py-2 text-fg placeholder-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Optional description for this tag..."
                />
              </div>
              <div className="rounded-lg bg-inset p-3">
                <p className="text-sm text-muted">
                  Post count:{" "}
                  <span className="font-mono font-medium text-fg">
                    {editingTag.postCount}
                  </span>
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="secondary-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTag.status === "pending"}
                  className="primary-button disabled:opacity-50"
                >
                  {updateTag.status === "pending"
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-faint" />
        </div>
      )}

      {status === "error" && (
        <div className="bg-danger/8 rounded-lg border border-danger/40 p-4 text-danger">
          Failed to load tags. Please refresh the page.
        </div>
      )}

      {status === "success" && (
        <div className="overflow-hidden rounded-lg border border-hairline">
          <table className="min-w-full divide-y divide-hairline">
            <thead className="bg-elevated">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="cursor-pointer px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint transition-colors hover:text-fg"
                >
                  Tag
                  <SortIcon field="title" sortField={sortField} />
                </th>
                <th className="px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint">
                  Slug
                </th>
                <th
                  onClick={() => handleSort("postCount")}
                  className="cursor-pointer px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint transition-colors hover:text-fg"
                >
                  Posts
                  <SortIcon field="postCount" sortField={sortField} />
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="cursor-pointer px-6 py-3 text-left font-mono text-xs uppercase tracking-label text-faint transition-colors hover:text-fg"
                >
                  Created
                  <SortIcon field="createdAt" sortField={sortField} />
                </th>
                <th className="px-6 py-3 text-right font-mono text-xs uppercase tracking-label text-faint">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-surface">
              {filteredTags?.map((tagItem) => (
                <tr
                  key={tagItem.id}
                  className={
                    mergeSource?.id === tagItem.id
                      ? "bg-danger/8"
                      : mergeTarget?.id === tagItem.id
                        ? "bg-success/8"
                        : "transition-colors hover:bg-elevated"
                  }
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-faint" />
                      <span className="font-medium text-fg">
                        {tagItem.title}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-faint">
                    {tagItem.slug || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs ${
                        tagItem.postCount === 0
                          ? "bg-danger/12 text-danger"
                          : tagItem.postCount < 5
                            ? "bg-warning/12 text-warning"
                            : "bg-success/12 text-success"
                      }`}
                    >
                      {tagItem.postCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-faint">
                    {new Date(tagItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      {showMergePanel && (
                        <>
                          <button
                            onClick={() =>
                              selectForMerge(
                                {
                                  id: tagItem.id,
                                  title: tagItem.title,
                                  postCount: tagItem.postCount,
                                },
                                "source",
                              )
                            }
                            className={`rounded px-2 py-1 font-mono text-xs uppercase tracking-label transition-colors ${
                              mergeSource?.id === tagItem.id
                                ? "bg-danger text-on-accent"
                                : "hover:bg-danger/12 border border-danger/40 text-danger"
                            }`}
                          >
                            Source
                          </button>
                          <button
                            onClick={() =>
                              selectForMerge(
                                {
                                  id: tagItem.id,
                                  title: tagItem.title,
                                  postCount: tagItem.postCount,
                                },
                                "target",
                              )
                            }
                            className={`rounded px-2 py-1 font-mono text-xs uppercase tracking-label transition-colors ${
                              mergeTarget?.id === tagItem.id
                                ? "bg-success text-on-accent"
                                : "hover:bg-success/12 border border-success/40 text-success"
                            }`}
                          >
                            Target
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          setEditingTag({
                            id: tagItem.id,
                            title: tagItem.title,
                            slug: tagItem.slug || "",
                            description: tagItem.description || "",
                            postCount: tagItem.postCount,
                          })
                        }
                        className="rounded p-1 text-muted transition-colors hover:bg-elevated hover:text-fg"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTags?.length === 0 && (
            <div className="py-12 text-center text-muted">
              {searchQuery ? "No tags match your search." : "No tags yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagsAdmin;
