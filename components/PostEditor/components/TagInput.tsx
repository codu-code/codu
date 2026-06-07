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
        <label className="eyebrow mb-2 block">
          <span className="slash">{"// "}</span>
          {label}
        </label>
      )}

      <div
        className={`flex flex-wrap items-center gap-2 rounded-md border bg-canvas p-2 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
          error ? "border-red-500" : "border-hairline"
        } ${disabled ? "opacity-50" : ""}`}
      >
        {/* Existing Tags */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-elevated px-3 py-1 font-mono text-sm font-medium text-fg"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="ml-1 rounded-full p-0.5 text-muted transition-colors hover:bg-inset hover:text-fg"
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
              className="w-full min-w-[120px] border-none bg-transparent px-1 py-1 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-0"
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {isOpen && inputValue.length >= 1 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full z-50 mt-1 max-h-64 w-72 overflow-y-auto rounded-lg border border-hairline bg-elevated shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center p-4 text-muted">
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
                              ? "bg-accent/15 text-accent"
                              : "text-muted hover:bg-surface hover:text-fg"
                          }`}
                        >
                          <span className="font-medium">
                            {suggestion.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-xs ${
                              suggestion.postCount > 100
                                ? "bg-accent/15 text-accent"
                                : suggestion.postCount > 10
                                  ? "bg-elevated text-muted"
                                  : "bg-inset text-faint"
                            }`}
                          >
                            {formatCount(suggestion.postCount)} posts
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : debouncedSearch.length >= 1 ? (
                  <div className="px-3 py-3 text-sm text-muted">
                    <p className="mb-2">No matching tags found</p>
                    <button
                      type="button"
                      onClick={() => addTag(inputValue)}
                      className="flex items-center gap-2 text-accent transition-colors hover:text-accent-soft"
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
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}

      {/* Help Text / Counter */}
      <div className="mt-1.5 flex items-center justify-between">
        {helpText && <p className="text-sm text-faint">{helpText}</p>}
        <span
          className={`font-mono text-sm ${
            isMaxReached ? "text-amber-500" : "text-faint"
          }`}
        >
          {tags.length}/{maxTags}
        </span>
      </div>
    </div>
  );
}
