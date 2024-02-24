"use server";

import {
  AdditionalDetailsSchema,
  type TypeAdditionalDetailsSchema,
} from "@/schema/additionalUserDetails";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";

export async function handleFormSubmit(dataInput: TypeAdditionalDetailsSchema) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const {
      firstName,
      surname,
      username,
      location,
      gender,
      dateOfBirth,
      professionalOrStudent,
      workplace,
      jobTitle,
      levelOfStudy,
      course,
    } = AdditionalDetailsSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        firstName,
        surname,
        username,
        location,
        gender,
        dateOfBirth,
        professionalOrStudent,
        workplace,
        jobTitle,
        levelOfStudy,
        course,
      },
    });
    return true;
  } catch (error) {
    console.error(
      "Error updating the User and DeveloperDetails models:",
      error,
    );
    return false;
  }
}
