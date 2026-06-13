import Link from "next/link";
import { getFaviconUrl, getHostname, safeExternalHref } from "@/utils/url";

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
  const faviconUrl = getFaviconUrl(websiteUrl, 64);
  const safeWebsite = safeExternalHref(websiteUrl);
  const sourceLink = slug ? `/${slug}` : "#";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
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
            <div className="bg-accent/12 flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-accent">
              {name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={sourceLink}
            className="font-semibold text-fg hover:underline"
          >
            {name}
          </Link>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {description}
            </p>
          )}
          {safeWebsite && (
            <a
              href={safeWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-accent hover:underline"
            >
              {getHostname(websiteUrl)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceInfoCard;
