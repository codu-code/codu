const FeedItemLoading = () => {
  return (
    <article className="animate-pulse rounded-lg border border-hairline bg-surface p-5">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-14 rounded-full bg-elevated" />
            <div className="h-5 w-5 rounded-full bg-elevated" />
            <div className="h-3 w-28 rounded bg-elevated" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-5 w-full rounded bg-elevated" />
            <div className="h-5 w-3/4 rounded bg-elevated" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="h-3 w-full rounded bg-elevated" />
            <div className="h-3 w-2/3 rounded bg-elevated" />
          </div>
        </div>
        {/* Preview thumbnail (top-right) */}
        <div className="h-[68px] w-[104px] flex-shrink-0 self-start rounded-sm bg-elevated" />
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        <div className="h-6 w-20 rounded-full bg-elevated" />
        <div className="h-3 w-14 rounded bg-elevated" />
        <div className="h-3 w-10 rounded bg-elevated" />
      </div>
    </article>
  );
};

export default FeedItemLoading;
