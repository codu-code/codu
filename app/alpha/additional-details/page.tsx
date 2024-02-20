import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";

export const selectUserDetails = {
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
    redirect("/get-started");
  }

  const details = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: selectUserDetails,
  });

  return <Content details={details} />;
}
