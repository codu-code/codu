"use server";

import { getServerAuthSession } from "@/server/auth";
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
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function handleFormSlideOneSubmit(dataInput: TypeSlideOneSchema) {
  const session = await getServerAuthSession();
  if (!session || !session.user) {
    redirect("/get-started");
  }

  try {
    const { firstName, surname, username, location } =
      slideOneSchema.parse(dataInput);

    await db
      .update(user)
      .set({
        firstName,
        surname,
        username,
        location,
      })
      .where(eq(user.id, session.user.id));

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

    await db
      .update(user)
      .set({
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
      })
      .where(eq(user.id, session.user.id));

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

    await db
      .update(user)
      .set({
        professionalOrStudent,
        course,
        jobTitle,
        levelOfStudy,
        workplace,
      })
      .where(eq(user.id, session.user.id));

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
