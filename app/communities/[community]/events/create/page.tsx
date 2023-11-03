import { EventForm } from "@/components/EventForm/EventForm";
import prisma from "../../../../../server/db/client";
import { getServerAuthSession } from "@/server/auth";
import { redirect, notFound } from "next/navigation";

async function CreateEventPage({ params }: { params: { community: string } }) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/get-started");
  }

  if (!params?.community) {
    notFound();
  }

  const community = await prisma.community.findUnique({
    where: {
      slug: params.community,
    },
    include: {
      members: {
        select: {
          id: true,
          isEventOrganiser: true,
          userId: true,
        },
      },
    },
  });

  if (!community) {
    notFound();
  }

  if (
    !community.members.some(
      (member) => member.userId === session.user?.id && member.isEventOrganiser,
    )
  ) {
    redirect("/forbidden");
  }

  return (
    <div className="mx-auto lg:col-span-9 max-w-2xl flex-grow flex flex-col justify-center w-full px-4 sm:px-6">
      <div className="bg-neutral-900 text-neutral-700 shadow-xl">
        <EventForm
          defaultValues={{
            address: "",
            description: "",
            name: "",
            capacity: 50,
            eventDate: new Date(),
            communityId: community.id,
            coverImage: "",
          }}
        />
      </div>
    </div>
  );
}

export default CreateEventPage;
