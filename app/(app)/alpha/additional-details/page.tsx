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
      name: true,
      gender: true,
      dateOfBirth: true,
      location: true,
      professionalOrStudent: true,
      course: true,
      levelOfStudy: true,
      jobTitle: true,
      workplace: true,
      image: true,
    },
    where: (user, { eq }) => eq(user.id, userId),
  });

  const detailsWithNullsRemoved = {
    username: details?.username || "",
    name: details?.name || "",
    gender: details?.gender || "",
    dateOfBirth: details?.dateOfBirth || "",
    location: details?.location || "",
    professionalOrStudent: details?.professionalOrStudent || "",
    course: details?.course || "",
    levelOfStudy: details?.levelOfStudy || "",
    jobTitle: details?.jobTitle || "",
    workplace: details?.workplace || "",
    image: details?.image || "",
  };

  return <Content details={detailsWithNullsRemoved} />;
}
