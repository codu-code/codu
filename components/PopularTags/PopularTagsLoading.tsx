//className="border border-neutral-300 bg-white px-6 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"

function PopularTagsLoading() {
  return (
    <div className=" w-full shadow dark:bg-black">
      <div>
        <div className="my-2 flex h-10">
          <div className="h-10 w-1/2 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-2/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
        </div>
        <div className="my-2 flex h-10">
          <div className="h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
        </div>
        <div className="my-2x flex h-10">
          <div className="h-10 w-1/2 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-2/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
        </div>
        <div className="my-2 flex h-10">
          <div className="h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-1/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
        </div>
        <div className="my-2x flex h-10">
          <div className="h-10 w-1/2 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
          <div className="ml-2 h-10 w-2/3 animate-pulse rounded-md bg-neutral-300 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export default PopularTagsLoading;
