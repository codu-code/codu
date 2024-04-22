import { CommunityForm } from "@/components/CommunityForm/CommunityForm";
import { getServerAuthSession } from "@/server/auth";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";

async function EditCommunityPage({
  params,
}: {
  params: { community: string };
}) {
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
        with: {
          user: true,
        },
      },
      events: {
        with: {
          RSVP: {
            columns: {
              id: true,
            },
          },
        },
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

  const { id, name, city, country, coverImage, description, excerpt } =
    community;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-grow flex-col justify-center px-4 sm:px-6 lg:col-span-9">
      <div className="bg-neutral-900 text-neutral-700 shadow-xl">
        <CommunityForm
          defaultValues={{
            id,
            name,
            city,
            country,
            coverImage: coverImage ? coverImage : "",
            description,
            excerpt,
          }}
        />
      </div>
    </div>
  );
}

export default EditCommunityPage;
