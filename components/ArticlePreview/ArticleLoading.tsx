const ArticleLoading = () => (
  <div className="my-4 w-full border-l-4 border-l-pink-600 bg-white p-4 shadow dark:bg-neutral-900">
    <div className="animate-pulse">
      <div className="flex space-x-4">
        <div className="h-10 w-10 rounded-full bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="grid grid-cols-8 gap-2">
            <div className="col-span-2 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
            <div className="col-span-4" />
            <div className="col-span-3 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
          </div>
        </div>
      </div>
      <div className="my-4 grid grid-cols-12 gap-x-4 space-y-2">
        <div className="col-span-8 mb-4 h-5 rounded bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="col-span-12 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="col-span-6 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="col-span-6 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
        <div className="col-span-12 h-2 rounded bg-neutral-300 dark:bg-neutral-800"></div>
      </div>
      <div className="col-span-5 mt-6 h-5 w-40 rounded bg-neutral-300 dark:bg-neutral-800"></div>
    </div>
  </div>
);

export default ArticleLoading;
