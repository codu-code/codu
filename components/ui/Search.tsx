"use client";

import {
  forwardRef,
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import Highlighter from "react-highlight-words";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type AutocompleteApi,
  createAutocomplete,
  type AutocompleteState,
  type AutocompleteCollection,
} from "@algolia/autocomplete-core";
import { getAlgoliaResults } from "@algolia/autocomplete-preset-algolia";
import algoliasearch from "algoliasearch/lite";
import { Dialog, Transition } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type Result = {
  title: string;
  summary: string;
  url: string;
  type: string;
};

type EmptyObject = Record<string, never>;

type Autocomplete = AutocompleteApi<
  Result,
  React.SyntheticEvent,
  React.MouseEvent,
  React.KeyboardEvent
>;

if (
  !process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ||
  !process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API
) {
  console.error(
    ".env values required for Algolia search (NEXT_PUBLIC_ALGOLIA_APP_ID and NEXT_PUBLIC_ALGOLIA_SEARCH_API). Visit https://www.algolia.com/ to create a free account and get your API keys.",
  );
}

if (!process.env.NEXT_PUBLIC_ALGOLIA_SOURCE_IDX) {
  console.error(
    ".env value required for Algolia source ID (NEXT_PUBLIC_ALGOLIA_SOURCE_IDX). Create an index in your Algolia account and set the value to the index name.",
  );
}

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API || "",
);

function useAutocomplete({ close }: { close: () => void }) {
  const id = useId();
  const router = useRouter();
  const [autocompleteState, setAutocompleteState] = useState<
    AutocompleteState<Result> | EmptyObject
  >({});

  function navigate({ itemUrl }: { itemUrl?: string }) {
    if (!itemUrl) {
      return;
    }

    router.push(itemUrl);

    if (
      itemUrl ===
      window.location.pathname + window.location.search + window.location.hash
    ) {
      close();
    }
  }

  const sourceId = process.env.NEXT_PUBLIC_ALGOLIA_SOURCE_IDX || "";

  const [autocomplete] = useState<Autocomplete>(() =>
    createAutocomplete<
      Result,
      React.SyntheticEvent,
      React.MouseEvent,
      React.KeyboardEvent
    >({
      id,
      placeholder: "Search the site",
      defaultActiveItemId: 0,
      onStateChange({ state }) {
        setAutocompleteState(state);
      },
      shouldPanelOpen({ state }) {
        return state.query !== "";
      },
      navigator: {
        navigate,
      },
      getSources({ query }) {
        return [
          {
            sourceId,
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: sourceId,
                    query,
                    params: {
                      hitsPerPage: 6,
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              return item.url;
            },
            onSelect: navigate,
          },
        ];
      },
    }),
  );

  return { autocomplete, autocompleteState };
}

function NoResultsIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
      />
    </svg>
  );
}

function LoadingIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  const id = useId();

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
      <path
        stroke={`url(#${id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
      />
      <defs>
        <linearGradient
          id={id}
          x1="13"
          x2="9.5"
          y1="9"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function HighlightQuery({ text, query }: { text: string; query: string }) {
  return (
    <Highlighter
      highlightClassName="underline bg-transparent text-pink-500"
      searchWords={[query]}
      autoEscape={true}
      textToHighlight={text}
    />
  );
}

function SearchResult({
  result,
  resultIndex,
  autocomplete,
  collection,
  query,
}: {
  result: Result;
  resultIndex: number;
  autocomplete: Autocomplete;
  collection: AutocompleteCollection<Result>;
  query: string;
}) {
  const id = useId();

  const hierarchy = [result.type, result.title].filter(
    (x): x is string => typeof x === "string",
  );

  return (
    <li
      className={clsx(
        "group block cursor-default px-4 py-3 aria-selected:bg-neutral-50 dark:aria-selected:bg-neutral-800/50",
        resultIndex > 0 &&
          "border-t border-neutral-100 dark:border-neutral-800",
      )}
      aria-labelledby={`${id}-hierarchy ${id}-title`}
      {...autocomplete.getItemProps({
        item: result,
        source: collection.source,
      })}
    >
      <div
        id={`${id}-title`}
        aria-hidden="true"
        className="text-sm font-medium text-neutral-900 group-aria-selected:text-pink-500 dark:text-white"
      >
        <HighlightQuery text={result.title} query={query} />
      </div>
      {hierarchy.length > 0 && (
        <div
          id={`${id}-hierarchy`}
          aria-hidden="true"
          className="text-2xs mt-1 truncate whitespace-nowrap text-neutral-500"
        >
          {hierarchy.map((item, itemIndex, items) => (
            <Fragment key={itemIndex}>
              <span className="capitalize">
                <HighlightQuery text={item} query={query} />
              </span>
              <span
                className={
                  itemIndex === items.length - 1
                    ? "sr-only"
                    : "mx-2 text-neutral-300 dark:text-neutral-700"
                }
              >
                /
              </span>
            </Fragment>
          ))}
        </div>
      )}
    </li>
  );
}

function SearchResults({
  autocomplete,
  query,
  collection,
}: {
  autocomplete: Autocomplete;
  query: string;
  collection: AutocompleteCollection<Result>;
}) {
  if (collection.items.length === 0) {
    return (
      <div className="p-6 text-center">
        <NoResultsIcon className="mx-auto h-5 w-5 stroke-neutral-900 dark:stroke-neutral-600" />
        <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-400">
          Nothing found for{" "}
          <strong className="break-words font-semibold text-neutral-900 dark:text-white">
            &lsquo;{query}&rsquo;
          </strong>
          . Please try again.
        </p>
      </div>
    );
  }

  return (
    <ul {...autocomplete.getListProps()}>
      {collection.items.map((result, resultIndex) => (
        <SearchResult
          key={result.url}
          result={result}
          resultIndex={resultIndex}
          autocomplete={autocomplete}
          collection={collection}
          query={query}
        />
      ))}
    </ul>
  );
}

const SearchInput = forwardRef<
  React.ElementRef<"input">,
  {
    autocomplete: Autocomplete;
    autocompleteState: AutocompleteState<Result> | EmptyObject;
    onClose: () => void;
  }
>(function SearchInput({ autocomplete, autocompleteState, onClose }, inputRef) {
  const inputProps = autocomplete.getInputProps({ inputElement: null });

  return (
    <div className="group relative flex h-12">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-0 h-full w-5 stroke-neutral-500" />
      <input
        ref={inputRef}
        className={clsx(
          "flex-auto appearance-none border-none bg-neutral-100 pl-10 text-neutral-950 outline-none ring-offset-0 placeholder:text-neutral-500 focus:w-full focus:flex-none focus:outline-none focus:ring-transparent dark:bg-neutral-900 dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden",
          autocompleteState.status === "stalled" ? "pr-11" : "pr-4",
        )}
        {...inputProps}
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            !autocompleteState.isOpen &&
            autocompleteState.query === ""
          ) {
            // In Safari, closing the dialog with the escape key can sometimes cause the scroll position to jump to the
            // bottom of the page. This is a workaround for that until we can figure out a proper fix in Headless UI.
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }

            onClose();
          } else {
            inputProps.onKeyDown(event);
          }
        }}
      />
      {autocompleteState.status === "stalled" && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <LoadingIcon className="h-5 w-5 animate-spin stroke-neutral-200 text-neutral-900 dark:stroke-neutral-800 dark:text-pink-400" />
        </div>
      )}
    </div>
  );
});

function SearchDialog({
  open,
  setOpen,
  className,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
}) {
  const formRef = useRef<React.ElementRef<"form">>(null);
  const panelRef = useRef<React.ElementRef<"div">>(null);
  const inputRef = useRef<React.ElementRef<typeof SearchInput>>(null);
  const { autocomplete, autocompleteState } = useAutocomplete({
    close() {
      setOpen(false);
    },
  });
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams, setOpen]);

  useEffect(() => {
    if (open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={() => autocomplete.setQuery("")}
    >
      <Dialog
        onClose={setOpen}
        className={clsx("fixed inset-0 z-50 opacity-95", className)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-400/25 backdrop-blur-sm dark:bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-[15vh]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto transform-gpu overflow-hidden rounded-lg bg-neutral-100 shadow-xl dark:bg-neutral-900 sm:max-w-xl">
              <div {...autocomplete.getRootProps({})}>
                <form
                  ref={formRef}
                  {...autocomplete.getFormProps({
                    inputElement: inputRef.current,
                  })}
                >
                  <SearchInput
                    ref={inputRef}
                    autocomplete={autocomplete}
                    autocompleteState={autocompleteState}
                    onClose={() => setOpen(false)}
                  />
                  <div
                    ref={panelRef}
                    className="border-t border-neutral-200 bg-white empty:hidden dark:border-neutral-100/5 dark:bg-neutral-900"
                    {...autocomplete.getPanelProps({})}
                  >
                    {autocompleteState.isOpen && (
                      <SearchResults
                        autocomplete={autocomplete}
                        query={autocompleteState.query}
                        collection={autocompleteState.collections[0]}
                      />
                    )}
                  </div>
                </form>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

function useSearchProps() {
  const buttonRef = useRef<React.ElementRef<"button">>(null);
  const [open, setOpen] = useState(false);

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true);
      },
    },
    dialogProps: {
      open,
      setOpen: useCallback(
        (open: boolean) => {
          const { width = 0, height = 0 } =
            buttonRef.current?.getBoundingClientRect() ?? {};
          if (!open || (width !== 0 && height !== 0)) {
            setOpen(open);
          }
        },
        [setOpen],
      ),
    },
  };
}

export function Search() {
  const [modifierKey, setModifierKey] = useState<string>();
  const { buttonProps, dialogProps } = useSearchProps();

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? "⌘" : "Ctrl ",
    );
  }, []);

  return (
    <div className="hidden lg:block lg:max-w-md lg:flex-auto">
      <button
        type="button"
        className="ui-not-focus-visible:outline-none hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-neutral-500 ring-1 ring-neutral-900/10 transition hover:ring-neutral-900/20 dark:bg-white/5 dark:text-neutral-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex"
        {...buttonProps}
      >
        <MagnifyingGlassIcon className="h-4 w-4 stroke-current" />
        Search the site
        <kbd className="text-2xs ml-auto text-neutral-400 dark:text-neutral-500">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="hidden lg:block" {...dialogProps} />
      </Suspense>
    </div>
  );
}

export function MobileSearch() {
  const { buttonProps, dialogProps } = useSearchProps();

  return (
    <div className="contents lg:hidden">
      <button
        type="button"
        className="ui-not-focus-visible:outline-none flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-neutral-900/5 dark:hover:bg-white/5 lg:hidden"
        aria-label="Search the site"
        {...buttonProps}
      >
        <MagnifyingGlassIcon className="h-5 w-5 stroke-current" />
      </button>
      <Suspense fallback={null}>
        <SearchDialog className="lg:hidden" {...dialogProps} />
      </Suspense>
    </div>
  );
}
