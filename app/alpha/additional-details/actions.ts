"use server";

import {
  type TypeSlideOneSchema,
  slideOneSchema,
} from "@/schema/additionalUserDetails";

import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";

export async function handleFormSlideOneSubmit(dataInput: TypeSlideOneSchema) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const { firstName, surname, username, location } =
      slideOneSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        firstName,
        surname,
        username,
        location,
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
