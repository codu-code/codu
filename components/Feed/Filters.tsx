"use client";

import { Fragment } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  ChevronDownIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  LinkIcon,
  QuestionMarkCircleIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/20/solid";

type SortOption = "recent" | "trending" | "popular";
type ContentType =
  | "ARTICLE"
  | "LINK"
  | "QUESTION"
  | "VIDEO"
  | "DISCUSSION"
  | null;

type Props = {
  sort: SortOption;
  type?: ContentType;
  category?: string | null;
  categories: string[];
  onSortChange: (_sort: SortOption) => void;
  onTypeChange?: (_type: ContentType) => void;
  onCategoryChange: (_category: string | null) => void;
  showTypeFilter?: boolean;
};

const sortOptions: {
  value: SortOption;
  label: string;
  icon: typeof ClockIcon;
}[] = [
  { value: "recent", label: "Recent", icon: ClockIcon },
  { value: "trending", label: "Trending", icon: FireIcon },
  { value: "popular", label: "Popular", icon: ArrowTrendingUpIcon },
];

const typeOptions: {
  value: ContentType;
  label: string;
  icon: typeof DocumentTextIcon;
}[] = [
  { value: null, label: "All Types", icon: Squares2X2Icon },
  { value: "ARTICLE", label: "Articles", icon: DocumentTextIcon },
  { value: "LINK", label: "Links", icon: LinkIcon },
  { value: "QUESTION", label: "Questions", icon: QuestionMarkCircleIcon },
  { value: "VIDEO", label: "Videos", icon: VideoCameraIcon },
  { value: "DISCUSSION", label: "Discussions", icon: ChatBubbleLeftRightIcon },
];

const FeedFilters = ({
  sort,
  type,
  category,
  categories,
  onSortChange,
  onTypeChange,
  onCategoryChange,
  showTypeFilter = true,
}: Props) => {
  const currentSort =
    sortOptions.find((opt) => opt.value === sort) || sortOptions[0];
  const currentType =
    typeOptions.find((opt) => opt.value === type) || typeOptions[0];

  return (
    <div
      className="flex items-center gap-2 sm:gap-3"
      data-testid="feed-filters"
    >
      {/* Content Type Dropdown */}
      {showTypeFilter && onTypeChange && (
        <Menu as="div" className="relative" data-testid="type-filter">
          <MenuButton className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated sm:px-3">
            <currentType.icon className="h-4 w-4" />
            <span>{currentType.label}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-hairline focus:outline-none">
              <div className="py-1">
                {typeOptions.map((option) => (
                  <MenuItem key={option.value || "all"}>
                    {({ focus }) => (
                      <button
                        onClick={() => onTypeChange(option.value)}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                          focus
                            ? "bg-elevated text-fg"
                            : "text-muted"
                        } ${
                          type === option.value
                            ? "font-medium text-accent dark:text-accent"
                            : ""
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      )}

      {/* Sort Dropdown */}
      <Menu as="div" className="relative" data-testid="sort-filter">
        <MenuButton className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated sm:px-3">
          <currentSort.icon className="h-4 w-4" />
          <span>{currentSort.label}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </MenuButton>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-hairline focus:outline-none">
            <div className="py-1">
              {sortOptions.map((option) => (
                <MenuItem key={option.value}>
                  {({ focus }) => (
                    <button
                      onClick={() => onSortChange(option.value)}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                        focus
                          ? "bg-elevated text-fg"
                          : "text-muted"
                      } ${
                        sort === option.value
                          ? "font-medium text-accent dark:text-accent"
                          : ""
                      }`}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Transition>
      </Menu>

      {/* Category Dropdown */}
      {categories.length > 0 && (
        <Menu as="div" className="relative" data-testid="topic-filter">
          <MenuButton className="flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated sm:px-3">
            <span>{category || "Topics"}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 z-10 mt-2 max-h-60 w-44 origin-top-right overflow-y-auto rounded-md bg-surface shadow-lg ring-1 ring-hairline focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => onCategoryChange(null)}
                      className={`block w-full px-4 py-2 text-left text-sm ${
                        focus
                          ? "bg-elevated text-fg"
                          : "text-muted"
                      } ${!category ? "font-medium text-accent dark:text-accent" : ""}`}
                    >
                      All Topics
                    </button>
                  )}
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat}>
                    {({ focus }) => (
                      <button
                        onClick={() => onCategoryChange(cat)}
                        className={`block w-full px-4 py-2 text-left text-sm capitalize ${
                          focus
                            ? "bg-elevated text-fg"
                            : "text-muted"
                        } ${
                          category === cat
                            ? "font-medium text-accent dark:text-accent"
                            : ""
                        }`}
                      >
                        {cat}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      )}
    </div>
  );
};

export default FeedFilters;
