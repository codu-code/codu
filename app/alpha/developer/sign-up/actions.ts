"use server";

import {
  type TypeDeveloperDetailsSchema,
  DeveloperDetailsSchema,
} from "@/schema/developerDetails";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";

export async function handleFormSubmit(dataInput: TypeDeveloperDetailsSchema) {
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
          location: validatedData.developerDetails.location,
          gender: validatedData.developerDetails.gender,
          dateOfBirth: validatedData.developerDetails.dateOfBirth,
          professionalOrStudent:
            validatedData.developerDetails.professionalOrStudent,
          workplace: validatedData.developerDetails.workplace,
          jobTitle: validatedData.developerDetails.jobTitle,
          levelOfStudy: validatedData.developerDetails.levelOfStudy,
          course: validatedData.developerDetails.course,
        },
      });
    } else {
      await prisma.developerDetails.create({
        data: {
          id: session.user.id,
          location: validatedData.developerDetails.location,
          gender: validatedData.developerDetails.gender,
          dateOfBirth: validatedData.developerDetails.dateOfBirth,
          professionalOrStudent:
            validatedData.developerDetails.professionalOrStudent,
          workplace: validatedData.developerDetails.workplace,
          jobTitle: validatedData.developerDetails.jobTitle,
          levelOfStudy: validatedData.developerDetails.levelOfStudy,
          course: validatedData.developerDetails.course,
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
