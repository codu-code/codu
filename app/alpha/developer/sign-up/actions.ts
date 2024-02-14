"use server";

import { TypeDeveloperDetailsSchema } from "@/schema/developerDetails";
import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";

export async function handleMyFormSubmit(
  dataInput: TypeDeveloperDetailsSchema,
) {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        developerDetails: true,
      },
    });

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: dataInput.name,
        username: dataInput.username,
      },
    });

    // Prisma does not seem to have a find or create query
    // A record will always exist in the User model
    // So first we need to check to see if a record exists in the DeveloperDetails model for the user id
    // Then either update it or create it
    const isExistDeveloperDetails = await prisma.developerDetails.findUnique({
      where: { id: session.user.id },
    });

    if (isExistDeveloperDetails) {
      await prisma.developerDetails.update({
        where: { id: session.user.id },
        data: {
          location: dataInput.developerDetails.location,
          gender: dataInput.developerDetails.gender,
          dateOfBirth: dataInput.developerDetails.dateOfBirth,
          professionalOrStudent:
            dataInput.developerDetails.professionalOrStudent,
          workplace: dataInput.developerDetails.workplace,
          jobTitle: dataInput.developerDetails.jobTitle,
          levelOfStudy: dataInput.developerDetails.levelOfStudy,
          course: dataInput.developerDetails.course,
        },
      });
    } else {
      await prisma.developerDetails.create({
        data: {
          id: session.user.id,
          location: dataInput.developerDetails.location,
          gender: dataInput.developerDetails.gender,
          dateOfBirth: dataInput.developerDetails.dateOfBirth,
          professionalOrStudent:
            dataInput.developerDetails.professionalOrStudent,
          workplace: dataInput.developerDetails.workplace,
          jobTitle: dataInput.developerDetails.jobTitle,
          levelOfStudy: dataInput.developerDetails.levelOfStudy,
          course: dataInput.developerDetails.course,
        },
      });
    }

    // Is this ok for error handling
    // return boolean and toast on the client?
    return true;
  } catch (error) {
    console.error(
      "Error updating the User and DeveloperDetails models:",
      error,
    );
    return false;
  }
}
