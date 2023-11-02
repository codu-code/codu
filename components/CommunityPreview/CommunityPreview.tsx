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
    <article className="border-l-4 border-l-pink-600 p-4 my-4 shadow-lg bg-neutral-900">
      <div className="flex flex-row">
        <div className="basis-1/4 mb-4">
          <span className="sr-only">{name}</span>
          <img
            className="rounded-lg object-cover w-full aspect-[16/9]"
            src={image}
            alt={`${name}'s avatar`}
          />
        </div>
        <div className="basis-3/4 pl-4">
          <header className="text-2xl leading-6 font-semibold tracking-wide">
            {name}
          </header>
          <p className="tracking-wide text-sm md:text-lg my-3 break-words">
            {excerpt}
          </p>
          <div className="text-xs text-neutral-500 mb-1">
            <div className="flex flex-row mr-2 mb-2">
              <MapPinIcon className="mr-2" />
              <p className="font-medium pt-0.5">
                {city}, {country}
              </p>
            </div>
            <div className="flex flex-row mr-2 mb-2">
              <UsersIcon className="mr-2" />
              <p className="font-medium pt-0.5">{membersCount} members</p>
            </div>
          </div>
          <div className="flex justify-between content-center w-full">
            <div className="flex items-center justify-between w-full">
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
