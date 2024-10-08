import { redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import {YearsOfExperience} from "./_client";
 

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
      yearsOfExperience: true,
    },
    where: (user, { eq }) => eq(user.id, userId),
  });

  const detailsWithNullsRemoved = {
    username: details?.username || "",
    firstName: details?.firstName || "",
    surname: details?.surname || "",
    gender: details?.gender || "",
    dateOfBirth: details?.dateOfBirth || "",
    location: details?.location || "",
    professionalOrStudent: details?.professionalOrStudent || "",
    course: details?.course || "",
    levelOfStudy: details?.levelOfStudy || "",
    jobTitle: details?.jobTitle || "",
    workplace: details?.workplace || "",
    yearsOfExperience: details?.yearsOfExperience && 
    ["0-1", "1-3", "3-5", "5-8", "8-12", "12+"].includes(details.yearsOfExperience)
      ? details.yearsOfExperience as YearsOfExperience // Cast to the union type
      : "0-1", 
  };

  return <Content details={detailsWithNullsRemoved} />;
}
