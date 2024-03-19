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
    <article className="my-4 border-l-4 border-neutral-300 border-l-pink-600 bg-white p-4 shadow-lg dark:border-neutral-600 dark:border-l-pink-600 dark:bg-neutral-900">
      <div className="flex flex-row">
        <div className="mb-4 basis-1/4">
          <span className="sr-only">{name}</span>
          <img
            className="aspect-[16/9] w-full rounded-lg object-cover"
            src={coverImage}
            alt={`${name}'s avatar`}
          />
        </div>
        <div className="basis-3/4 pl-4">
          <header className="mb-3 text-2xl font-semibold leading-6 tracking-wide">
            {name}
          </header>
          <div className="mb-1 text-xs text-neutral-500">
            <div className="mb-2 mr-2 flex flex-row">
              <CalendarIcon className="mr-2" />
              <p className="pt-0.5 font-medium">{readableDate}</p>
            </div>
            <div className="mb-2 mr-2 flex flex-row">
              <MapPinIcon className="mr-2" />
              <p className="pt-0.5 font-medium">{address}</p>
            </div>
            <div className="mb-2 mr-2 flex flex-row">
              <UsersIcon className="mr-2" />
              <p className="pt-0.5 font-medium">{attendees} attendees</p>
            </div>
          </div>
          <div className="flex w-full content-center justify-between">
            <div className="flex w-full items-center justify-between">
              <Link
                className="fancy-link semibold text-lg"
                href={`/hub/${communitySlug}/events/${eventSlug}`}
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
