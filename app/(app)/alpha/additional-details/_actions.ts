"use server";

import { getServerAuthSession } from "@/server/auth";
import prisma from "@/server/db/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  type TypeSlideOneSchema,
  type TypeSlideTwoSchema,
  type TypeSlideThreeSchema,
  slideOneSchema,
  slideTwoSchema,
  slideThreeSchema,
} from "@/schema/additionalUserDetails";

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
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    } else {
      console.error("Error updating the User model:", error);
    }
    return false;
  }
}

export async function handleFormSlideTwoSubmit(dataInput: TypeSlideTwoSchema) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const { dateOfBirth, gender } = slideTwoSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        dateOfBirth,
        gender,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    } else {
      console.error("Error updating the User model:", error);
    }
    return false;
  }
}

export async function handleFormSlideThreeSubmit(
  dataInput: TypeSlideThreeSchema,
) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const { professionalOrStudent, course, jobTitle, levelOfStudy, workplace } =
      slideThreeSchema.parse(dataInput);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        professionalOrStudent,
        course,
        jobTitle,
        levelOfStudy,
        workplace,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
    } else {
      console.error("Error updating the User model:", error);
    }
    return false;
  }
}
