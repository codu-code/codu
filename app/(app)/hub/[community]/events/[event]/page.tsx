import { notFound } from "next/navigation";
import prisma from "@/server/db/client";
import EventPage from "./_EventPage";

type Props = { params: { event: string } };

const Page = async ({ params }: Props) => {
  if (!params?.event) {
    notFound();
  }

  const event = await prisma.event.findUnique({
    where: {
      slug: params.event,
    },
    include: {
      RSVP: {
        include: {
          user: true,
        },
      },
      community: {
        select: {
          excerpt: true,
          slug: true,
          name: true,
          city: true,
          country: true,
          coverImage: true,
          members: {
            select: {
              id: true,
              isEventOrganiser: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  return <EventPage event={event} />;
};

export default Page;
