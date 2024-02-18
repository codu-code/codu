import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { TypeDeveloperDetailsWithNullDateOfBirth } from "@/schema/developerDetails";

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

  let flattenedDetails: TypeDeveloperDetailsWithNullDateOfBirth | null = null;

  if (details) {
    flattenedDetails = {
      name: details.name,
      username: details.username || "",
      dateOfBirth: details.developerDetails?.dateOfBirth || null,
      course: details.developerDetails?.course || "",
      gender: details.developerDetails?.gender || "",
      levelOfStudy: details.developerDetails?.levelOfStudy || "",
      jobTitle: details.developerDetails?.jobTitle || "",
      workplace: details.developerDetails?.workplace || "",
      professionalOrStudent:
        details.developerDetails?.professionalOrStudent || "",
      location: details.developerDetails?.location || "",
    };
  }

  return <Content details={flattenedDetails} />;
}
