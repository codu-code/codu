const ContentCardLoading = () => {
  return (
    <article className="my-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header row */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="h-4 w-4 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-1 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Content row */}
      <div className="flex gap-3">
        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title */}
          <div className="mb-1 h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-2 h-5 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />

          {/* Excerpt */}
          <div className="mb-1 h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />

          {/* Action bar */}
          <div className="mt-auto flex items-center gap-1.5">
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-6 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-6 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-6 w-14 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>

        {/* Thumbnail placeholder */}
        <div className="hidden w-[120px] flex-shrink-0 sm:block">
          <div className="aspect-video w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </article>
  );
};

export default ContentCardLoading;
