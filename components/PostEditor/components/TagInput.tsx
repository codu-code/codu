"use client";

import {
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { X, Tag as TagIcon } from "lucide-react";

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
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  const isMaxReached = tags.length >= maxTags;

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}

      <div
        className={`flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2 transition-colors focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20 dark:bg-neutral-800 ${
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
            <TagIcon className="h-3 w-3" />
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
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            disabled={disabled}
            className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-1 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-neutral-500"
          />
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
