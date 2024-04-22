import { notFound } from "next/navigation";
import EventPage from "./_EventPage";
import { db } from "@/server/db";

type Props = { params: { event: string } };

const Page = async ({ params }: Props) => {
  if (!params?.event) {
    notFound();
  }

  const event = await db.query.event.findFirst({
    with: {
      RSVP: {
        with: {
          user: true,
        },
      },
      community: {
        columns: {
          excerpt: true,
          slug: true,
          name: true,
          city: true,
          country: true,
          coverImage: true,
        },
        with: {
          members: {
            columns: {
              id: true,
              isEventOrganiser: true,
              userId: true,
            },
          },
        },
      },
    },
    where: (event, { eq, and }) => and(eq(event.slug, params.event)),
  });

  if (!event) {
    notFound();
  }

  return <EventPage event={event} />;
};

export default Page;
