"use server";

import {
  DeveloperDetailsSchema,
  type TypeDeveloperDetailsWithNullDateOfBirth,
} from "@/schema/developerDetails";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";

export async function handleFormSubmit(
  dataInput: TypeDeveloperDetailsWithNullDateOfBirth,
) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const validatedData = DeveloperDetailsSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: validatedData.name,
        username: validatedData.username,
      },
    });

    const isExistDeveloperDetails = await prisma.developerDetails.findUnique({
      where: { id: session.user.id },
    });

    if (isExistDeveloperDetails) {
      await prisma.developerDetails.update({
        where: { id: session.user.id },
        data: {
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
    } else {
      await prisma.developerDetails.create({
        data: {
          id: session.user.id,
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
    }
    return true;
  } catch (error) {
    console.error(
      "Error updating the User and DeveloperDetails models:",
      error,
    );
    return false;
  }
}
