import { notFound } from "next/navigation";
import CommunityPage from "./_CommunityPage";
import { db } from "@/server/db";

type Props = { params: { community: string } };

const Page = async ({ params }: Props) => {
  if (!params?.community) {
    notFound();
  }

  const community = await db.query.community.findFirst({
    with: {
      members: {
        with: { user: true },
      },
      events: {
        with: { RSVP: { columns: { id: true } } },
      },
    },
    where: (commmunity, { eq, and }) =>
      and(eq(commmunity.slug, params.community)),
  });

  if (!community) {
    notFound();
  }

  return <CommunityPage community={community} />;
};

export default Page;
