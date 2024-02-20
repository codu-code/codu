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
    const validatedData = AdditionalDetailsSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        firstName: validatedData.firstName,
        surname: validatedData.surname,
        username: validatedData.username,
        location: validatedData.location,
        gender: validatedData.gender,
        dateOfBirth: validatedData.dateOfBirth,
        professionalOrStudent: validatedData.professionalOrStudent,
        workplace: validatedData.workplace,
        jobTitle: validatedData.jobTitle,
        levelOfStudy: validatedData.levelOfStudy,
        course: validatedData.course,
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
