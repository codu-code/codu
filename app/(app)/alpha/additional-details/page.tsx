import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";

export default async function Page() {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    return redirect("/get-started");
  }

  const userId = session.user.id;
  const details = await db.query.user.findFirst({
    columns: {
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
    },
    where: (user, { eq }) => eq(user.id, userId),
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
