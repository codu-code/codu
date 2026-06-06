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
      sortField === field ? "text-accent" : "text-neutral-400"
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
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Tag Management
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage, merge, and curate tags across the platform
          </p>
        </div>
        <button
          onClick={() => recalculateCounts.mutate()}
          disabled={recalculateCounts.status === "pending"}
          className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${recalculateCounts.status === "pending" ? "animate-spin" : ""}`}
          />
          Recalculate Counts
        </button>
      </div>

      {/* Stats Cards */}
      {data?.stats && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Total Tags
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {data.stats.totalTags}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Total Tagged Posts
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {data.stats.totalPosts.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Unused Tags
            </p>
            <p className="text-2xl font-bold text-accent dark:text-accent">
              {data.stats.tagsWithNoPosts}
            </p>
          </div>
        </div>
      )}

      {/* Merge Suggestions */}
      {mergeSuggestions?.data && mergeSuggestions.data.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <div className="mb-3 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
              AI Merge Suggestions ({mergeSuggestions.data.length})
            </h3>
          </div>
          <div className="space-y-2">
            {mergeSuggestions.data.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {suggestion.sourceTag?.title}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({suggestion.sourceTag?.postCount} posts)
                  </span>
                  <ArrowsRightLeftIcon className="h-4 w-4 text-neutral-400" />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {suggestion.targetTag?.title}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({suggestion.targetTag?.postCount} posts)
                  </span>
                  {suggestion.reason && (
                    <span className="ml-2 text-xs text-neutral-500">
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
                    className="rounded p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                    title="Approve & Merge"
                  >
                    <CheckIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(suggestion.id)}
                    disabled={reviewSuggestion.status === "pending"}
                    className="rounded p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
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

      {/* Merge Panel */}
      {showMergePanel && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
              Merge Tags
            </h3>
            <button
              onClick={() => {
                setShowMergePanel(false);
                setMergeSource(null);
                setMergeTarget(null);
              }}
              className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="mb-1 text-sm text-blue-700 dark:text-blue-300">
                Source (will be deleted)
              </p>
              <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-700 dark:bg-neutral-800">
                {mergeSource ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mergeSource.title}</span>
                    <span className="text-sm text-neutral-500">
                      {mergeSource.postCount} posts
                    </span>
                  </div>
                ) : (
                  <span className="text-neutral-400">
                    Click a tag below to select
                  </span>
                )}
              </div>
            </div>
            <ArrowsRightLeftIcon className="h-6 w-6 text-blue-400" />
            <div className="flex-1">
              <p className="mb-1 text-sm text-blue-700 dark:text-blue-300">
                Target (will keep)
              </p>
              <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-700 dark:bg-neutral-800">
                {mergeTarget ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mergeTarget.title}</span>
                    <span className="text-sm text-neutral-500">
                      {mergeTarget.postCount} posts
                    </span>
                  </div>
                ) : (
                  <span className="text-neutral-400">
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
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {mergeTags.status === "pending" ? "Merging..." : "Merge"}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full rounded-lg border border-neutral-300 py-2 pl-10 pr-4 dark:border-neutral-600 dark:bg-neutral-800"
          />
        </div>
        <button
          onClick={() => setShowMergePanel(!showMergePanel)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            showMergePanel
              ? "bg-blue-600 text-white"
              : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          }`}
        >
          <ArrowsRightLeftIcon className="h-5 w-5" />
          Merge Mode
        </button>
      </div>

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 dark:bg-neutral-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Edit Tag
              </h2>
              <button
                onClick={() => setEditingTag(null)}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Title
                </label>
                <input
                  type="text"
                  value={editingTag.title}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Slug
                </label>
                <input
                  type="text"
                  value={editingTag.slug}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, slug: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
                  placeholder="Optional description for this tag..."
                />
              </div>
              <div className="rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Post count:{" "}
                  <span className="font-medium">{editingTag.postCount}</span>
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTag.status === "pending"}
                  className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
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

      {/* Tags Table */}
      {status === "pending" && (
        <div className="flex items-center justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Failed to load tags. Please refresh the page.
        </div>
      )}

      {status === "success" && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Tag
                  <SortIcon field="title" sortField={sortField} />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Slug
                </th>
                <th
                  onClick={() => handleSort("postCount")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Posts
                  <SortIcon field="postCount" sortField={sortField} />
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Created
                  <SortIcon field="createdAt" sortField={sortField} />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-700 dark:bg-neutral-900">
              {filteredTags?.map((tagItem) => (
                <tr
                  key={tagItem.id}
                  className={`${
                    mergeSource?.id === tagItem.id
                      ? "bg-red-50 dark:bg-red-950"
                      : mergeTarget?.id === tagItem.id
                        ? "bg-green-50 dark:bg-green-950"
                        : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {tagItem.title}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {tagItem.slug || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        tagItem.postCount === 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : tagItem.postCount < 5
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {tagItem.postCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
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
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                              mergeSource?.id === tagItem.id
                                ? "bg-red-500 text-white"
                                : "border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
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
                            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                              mergeTarget?.id === tagItem.id
                                ? "bg-green-500 text-white"
                                : "border border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950"
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
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
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
            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400">
              {searchQuery ? "No tags match your search." : "No tags yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagsAdmin;
