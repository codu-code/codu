import Link from "next/link";

interface InlineAuthorBioProps {
  name: string;
  username: string;
  image?: string | null;
  bio?: string | null;
}

const InlineAuthorBio = ({
  name,
  username,
  image,
  bio,
}: InlineAuthorBioProps) => {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/${username}`} className="flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent dark:bg-accent/15 dark:text-accent">
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/${username}`}
            className="font-medium text-neutral-900 hover:underline dark:text-neutral-100"
          >
            {name}
          </Link>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            @{username}
          </span>
        </div>
        {bio && (
          <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
};

export default InlineAuthorBio;
