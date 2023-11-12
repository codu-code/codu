import type { NextPage } from "next";
import Link from "next/link";
import { MapPinIcon, UsersIcon } from "lucide-react";

type Props = {
  excerpt: string;
  slug: string;
  name: string;
  image: string;
  city: string;
  country: string;
  membersCount: number;
  id: string;
};

const CommunityPreview: NextPage<Props> = ({
  slug,
  name,
  image,
  excerpt,
  city,
  country,
  membersCount,
}) => {
  return (
    <article className="my-4 border-l-4 border-l-pink-600 bg-neutral-900 p-4 shadow-lg">
      <div className="flex flex-row">
        <div className="mb-4 basis-1/4">
          <span className="sr-only">{name}</span>
          <img
            className="aspect-[16/9] w-full rounded-lg object-cover"
            src={image}
            alt={`${name}'s avatar`}
          />
        </div>
        <div className="basis-3/4 pl-4">
          <header className="text-2xl font-semibold leading-6 tracking-wide">
            {name}
          </header>
          <p className="my-3 break-words text-sm tracking-wide md:text-lg">
            {excerpt}
          </p>
          <div className="mb-1 text-xs text-neutral-500">
            <div className="mb-2 mr-2 flex flex-row">
              <MapPinIcon className="mr-2" />
              <p className="pt-0.5 font-medium">
                {city}, {country}
              </p>
            </div>
            <div className="mb-2 mr-2 flex flex-row">
              <UsersIcon className="mr-2" />
              <p className="pt-0.5 font-medium">{membersCount} members</p>
            </div>
          </div>
          <div className="flex w-full content-center justify-between">
            <div className="flex w-full items-center justify-between">
              <Link
                className="fancy-link semibold text-lg"
                href={`/communities/${slug}`}
              >
                See community details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default CommunityPreview;
