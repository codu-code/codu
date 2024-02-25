import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";

const selectUserDetails = {
  username: true,
  firstName: true,
  surname: true,
  gender: true,
  dateOfBirth: true,
  location: true,
  professionalOrStudent: true,
  course: true,
  levelOfStudy: true,
  jobTitle: true,
  workplace: true,
};

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    return redirect("/get-started");
  }

  const details = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: selectUserDetails,
  });

  const detailsWithNullsRemoved = {
    username: details?.username || "",
    firstName: details?.firstName || "",
    surname: details?.surname || "",
    gender: details?.gender || "",
    dateOfBirth: details?.dateOfBirth || undefined,
    location: details?.location || "",
    professionalOrStudent: details?.professionalOrStudent || "",
    course: details?.course || "",
    levelOfStudy: details?.levelOfStudy || "",
    jobTitle: details?.jobTitle || "",
    workplace: details?.workplace || "",
  };

  return <Content details={detailsWithNullsRemoved} />;
}
