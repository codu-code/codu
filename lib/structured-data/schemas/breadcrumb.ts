import type { BreadcrumbList, WithContext } from "../types";

interface BreadcrumbItemInput {
  name: string;
  url?: string;
}

/**
 * Generate BreadcrumbList schema for navigation
 * @param items Array of breadcrumb items from root to current page
 *              Last item typically has no URL (current page)
 */
export function getBreadcrumbSchema(
  items: BreadcrumbItemInput[],
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      // Only include item URL if provided (last item usually doesn't have one)
      ...(item.url && { item: item.url }),
    })),
  };
}
