import Link from "next/link";

// Get favicon URL from a website
const getFaviconUrl = (
  websiteUrl: string | null | undefined,
): string | null => {
  if (!websiteUrl) return null;
  try {
    const url = new URL(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return null;
  }
};

interface SourceInfoCardProps {
  name: string;
  slug: string | null;
  description?: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
}

const SourceInfoCard = ({
  name,
  slug,
  description,
  logo,
  websiteUrl,
}: SourceInfoCardProps) => {
  const faviconUrl = getFaviconUrl(websiteUrl);
  const sourceLink = slug ? `/feed/${slug}` : "#";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <Link href={sourceLink} className="flex-shrink-0">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : faviconUrl ? (
            <img src={faviconUrl} alt="" className="h-12 w-12 rounded-lg" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-lg font-bold text-accent dark:bg-accent/15 dark:text-accent">
              {name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={sourceLink}
            className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {name}
          </Link>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </p>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {new URL(websiteUrl).hostname}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceInfoCard;
