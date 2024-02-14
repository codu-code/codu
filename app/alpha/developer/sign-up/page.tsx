import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  const select = {
    name: true,
    username: true,
    developerDetails: {
      select: {
        course: true,
        dateOfBirth: true,
        gender: true,
        levelOfStudy: true,
        jobTitle: true,
        workplace: true,
        professionalOrStudent: true,
        location: true,
      },
    },
  };

  const details = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select,
  });

  // Should I add errror handling here for the case of null return/loading??

  return <Content details={details} />;
}
