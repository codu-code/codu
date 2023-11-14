import { notFound } from "next/navigation";
import prisma from "../../../server/db/client";
import CommunityPage from "./_CommunityPage";

type Props = { params: { community: string } };

const Page = async ({ params }: Props) => {
  if (!params?.community) {
    notFound();
  }

  const community = await prisma.community.findUnique({
    where: {
      slug: params.community,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      events: {
        include: {
          RSVP: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!community) {
    notFound();
  }

  return <CommunityPage community={community} />;
};

export default Page;
