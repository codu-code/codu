"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { X, Tag as TagIcon, Loader2 } from "lucide-react";
import { api } from "@/server/trpc/react";
import { useDebounce } from "@/hooks/useDebounce";

interface TagSuggestion {
  id: number;
  title: string;
  slug: string | null;
  postCount: number;
}

interface TagInputProps {
  /** Current tags */
  tags: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Label text */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export function TagInput({
  tags,
  onChange,
  maxTags = 5,
  placeholder = "Add tags (press Enter or comma)",
  error,
  label = "Topics",
  helpText = "Tag with up to 5 topics. This makes it easier for readers to find and know what your story is about.",
  disabled = false,
  className = "",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [lastSuggestionsLength, setLastSuggestionsLength] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  // Search for tags
  const { data: searchResults, isLoading } = api.tag.search.useQuery(
    { query: debouncedSearch, limit: 8 },
    {
      enabled: debouncedSearch.length >= 1 && isOpen,
      staleTime: 30000,
    },
  );

  // Filter out already selected tags
  const suggestions: TagSuggestion[] = useMemo(
    () =>
      searchResults?.data?.filter(
        (t) => !tags.includes(t.title.toLowerCase()),
      ) || [],
    [searchResults?.data, tags],
  );

  // Reset highlighted index when suggestions change (synchronous state derivation)
  if (suggestions.length !== lastSuggestionsLength) {
    setHighlightedIndex(-1);
    setLastSuggestionsLength(suggestions.length);
  }

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();

      // Validate tag
      if (!trimmedTag) return;
      if (tags.includes(trimmedTag)) return;
      if (tags.length >= maxTags) return;

      // Add tag
      onChange([...tags, trimmedTag]);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [tags, maxTags, onChange],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags, onChange],
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Check for comma to add tag
    if (value.includes(",")) {
      const parts = value.split(",");
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          // Add all parts except the last one (which might be empty or partial)
          addTag(part);
        } else {
          // Keep the last part in the input
          setInputValue(part);
        }
      });
    } else {
      setInputValue(value);
      if (value.length >= 1) {
        setIsOpen(true);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addTag(suggestions[highlightedIndex].title);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMaxReached = tags.length >= maxTags;

  // Format post count for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}

      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 dark:bg-neutral-800 ${
          error
            ? "border-red-500 dark:border-red-500"
            : "border-neutral-300 dark:border-neutral-600"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {/* Existing Tags */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="ml-1 rounded-full p-0.5 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:hover:text-neutral-200"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        {!isMaxReached && (
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.length >= 1 && setIsOpen(true)}
              placeholder={tags.length === 0 ? placeholder : "Add more..."}
              disabled={disabled}
              className="w-full min-w-[120px] border-none bg-transparent px-1 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-neutral-500"
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {isOpen && inputValue.length >= 1 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full z-50 mt-1 max-h-64 w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center p-4 text-neutral-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">Searching...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          onClick={() => addTag(suggestion.title)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                            highlightedIndex === index
                              ? "bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent"
                              : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
                          }`}
                        >
                          <span className="font-medium">
                            {suggestion.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              suggestion.postCount > 100
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : suggestion.postCount > 10
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                            }`}
                          >
                            {formatCount(suggestion.postCount)} posts
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : debouncedSearch.length >= 1 ? (
                  <div className="px-3 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    <p className="mb-2">No matching tags found</p>
                    <button
                      type="button"
                      onClick={() => addTag(inputValue)}
                      className="flex items-center gap-2 text-accent hover:text-accent dark:text-accent dark:hover:text-accent"
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                      <span>
                        Create &quot;{inputValue.toLowerCase().trim()}&quot;
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help Text / Counter */}
      <div className="mt-1.5 flex items-center justify-between">
        {helpText && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {helpText}
          </p>
        )}
        <span
          className={`text-sm ${
            isMaxReached
              ? "text-amber-600 dark:text-amber-400"
              : "text-neutral-400 dark:text-neutral-500"
          }`}
        >
          {tags.length}/{maxTags}
        </span>
      </div>
    </div>
  );
}
