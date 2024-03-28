import { notFound, redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { customAlphabet } from "nanoid";
import * as Sentry from "@sentry/nextjs";
import { isUserSubscribedToNewsletter } from "@/server/lib/newsletter";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Settings - Update your profile",
};

// @TODO - Loading state for this page

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect("/get-started");
  }

  const existingUser = await db.query.user.findFirst({
    columns: {
      name: true,
      username: true,
      bio: true,
      location: true,
      websiteUrl: true,
      emailNotifications: true,
      newsletter: true,
      image: true,
    },
    where: (users, { eq }) => eq(users.id, session.user!.id),
  });

  if (!existingUser?.username) {
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 3);

    const userName = session.user.name || "";
    const cleanedUserName = userName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const initialUsername =
      `${cleanedUserName.replace(/\s/g, "-")}-${nanoid()}`.toLowerCase();

    const [newUser] = await db
      .update(user)
      .set({ username: initialUsername })
      .where(eq(user.id, session.user.id))
      .returning({
        name: user.name,
        username: user.username,
        bio: user.bio,
        location: user.location,
        websiteUrl: user.websiteUrl,
        emailNotifications: user.emailNotifications,
        newsletter: user.newsletter,
        image: user.image,
      });
    return <Content profile={newUser} />;
  }

  if (!session.user.email) {
    return notFound();
  }

  try {
    const newsletter = await isUserSubscribedToNewsletter(session.user.email);
    const cleanedUser = {
      ...existingUser,
      newsletter,
    };
    return <Content profile={cleanedUser} />;
  } catch (error) {
    Sentry.captureException(error);
    return <Content profile={existingUser} />;
  }
}
