import type { NextPage } from "next";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { UsersIcon, CalendarIcon, MapPinIcon } from "lucide-react";

type Props = {
  id: string;
  eventDate: string;
  name: string;
  description: string;
  address: string;
  communitySlug: string;
  eventSlug: string;
  attendees: number;
  coverImage: string;
  commnunityName: string;
};

const EventPreview: NextPage<Props> = (props) => {
  const {
    eventDate,
    name,
    address,
    attendees,
    communitySlug,
    eventSlug,
    coverImage,
  } = props;
  const dateTime = Temporal.Instant.from(eventDate);

  const readableDate = dateTime.toLocaleString(["en-IE"], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <article className="border-l-4 border-l-pink-600 p-4 my-4 shadow-lg bg-neutral-900">
      <div className="flex flex-row">
        <div className="basis-1/4 mb-4">
          <span className="sr-only">{name}</span>
          <img
            className="rounded-lg object-cover w-full aspect-[16/9]"
            src={coverImage}
            alt={`${name}'s avatar`}
          />
        </div>
        <div className="basis-3/4 pl-4">
          <header className="mb-3 text-2xl leading-6 font-semibold tracking-wide">
            {name}
          </header>
          <div className="text-xs text-neutral-500 mb-1">
            <div className="flex flex-row mr-2 mb-2">
              <CalendarIcon className="mr-2" />
              <p className="font-medium pt-0.5">{readableDate}</p>
            </div>
            <div className="flex flex-row mr-2 mb-2">
              <MapPinIcon className="mr-2" />
              <p className="font-medium pt-0.5">{address}</p>
            </div>
            <div className="flex flex-row mr-2 mb-2">
              <UsersIcon className="mr-2" />
              <p className="font-medium pt-0.5">{attendees} attendees</p>
            </div>
          </div>
          <div className="flex justify-between content-center w-full">
            <div className="flex items-center justify-between w-full">
              <Link
                className="fancy-link semibold text-lg"
                href={`/communities/${communitySlug}/events/${eventSlug}`}
              >
                See event details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventPreview;
