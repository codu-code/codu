import { EventForm } from "@/components/EventForm/EventForm";
import { getServerAuthSession } from "@/server/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/server/db";

async function CreateEventPage({ params }: { params: { community: string } }) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/get-started");
  }

  if (!params?.community) {
    notFound();
  }

  const community = await db.query.community.findFirst({
    with: {
      members: {
        columns: { id: true, isEventOrganiser: true, userId: true },
      },
    },
    where: (commmunity, { eq, and }) =>
      and(eq(commmunity.slug, params.community)),
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
    <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col justify-center px-4 sm:px-6 lg:col-span-9">
      <div className="bg-neutral-900 text-neutral-700 shadow-xl">
        <EventForm
          defaultValues={{
            address: "",
            description: "",
            name: "",
            capacity: 50,
            eventDate: new Date().toISOString(),
            communityId: community.id,
            coverImage: "",
          }}
        />
      </div>
    </div>
  );
}

export default CreateEventPage;
