"use server";

import Link from "next/link";
import { GetTags } from "@/server/lib/tags";
import { getCamelCaseFromLower } from "@/utils/utils";

export default async function PopularTags() {
  const tags = await GetTags({ take: 10 });
  // Refactor with option to refresh
  if (!tags)
    return (
      <div className="relative mt-4 text-lg font-semibold md:col-span-7">
        Something went wrong loading topics... Please refresh the page.
      </div>
    );

  return (
    <>
      {tags.map((tag) => (
        <Link
          // only reason this is toLowerCase is to make url look nicer. Not needed for functionality
          href={`/articles?tag=${tag.title.toLowerCase()}`}
          key={tag.title}
          className="border border-neutral-300 bg-white px-6 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
        >
          {getCamelCaseFromLower(tag.title)}
        </Link>
      ))}
    </>
  );
}
