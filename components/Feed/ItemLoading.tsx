const FeedItemLoading = () => {
  return (
    <article className="my-2 animate-pulse rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Source info row - full width above content */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Content row with title aligned with image */}
      <div className="flex gap-3">
        {/* Main content skeleton */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Title skeleton */}
          <div className="mb-1 space-y-1.5">
            <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* URL skeleton */}
          <div className="mb-2 h-3 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />

          {/* Excerpt skeleton */}
          <div className="mb-2 space-y-1">
            <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* Action bar skeleton - smaller buttons with outlines */}
          <div className="mt-auto flex items-center gap-1.5">
            <div className="h-6 w-16 rounded-full border border-neutral-200 dark:border-neutral-700" />
            <div className="h-6 w-10 rounded-full border border-neutral-200 dark:border-neutral-700" />
            <div className="h-6 w-12 rounded-full border border-neutral-200 dark:border-neutral-700" />
            <div className="h-6 w-12 rounded-full border border-neutral-200 dark:border-neutral-700" />
          </div>
        </div>

        {/* Thumbnail skeleton on right - aligned with title, 16:9 aspect ratio */}
        <div className="hidden w-[120px] flex-shrink-0 self-start overflow-hidden rounded-lg sm:block">
          <div className="aspect-video w-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </article>
  );
};

export default FeedItemLoading;
