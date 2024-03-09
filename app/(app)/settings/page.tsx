import { notFound, redirect } from "next/navigation";
import Content from "./_client";
import { getServerAuthSession } from "@/server/auth";
import { customAlphabet } from "nanoid";
import prisma from "@/server/db/client";
import * as Sentry from "@sentry/nextjs";
import { isUserSubscribedToNewsletter } from "@/server/lib/newsletter";

export const metadata = {
  title: "Settings - Update your profile",
};

// @TODO - Loading state for this page

export default async function Page() {
  const session = await getServerAuthSession();

  const select = {
    name: true,
    username: true,
    bio: true,
    location: true,
    websiteUrl: true,
    emailNotifications: true,
    newsletter: true,
    image: true,
  };

  if (!session || !session.user) {
    redirect("/get-started");
  }

  let user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select,
  });

  const userName = user?.username;
  if (userName) {
    const cleanedUserName = userName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (userName !== cleanedUserName) {
      user = await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          username: cleanedUserName,
        },
        select,
      });
    }
  }

  if (!user?.username) {
    const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 3);
    const initialUsername = `${(session.user.name || "").replace(
      /\s/g,
      "-",
    )}-${nanoid()}`.toLowerCase();

    const newUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        username: initialUsername,
      },
      select,
    });

    return <Content profile={newUser} />;
  }

  if (!session.user.email) {
    return notFound();
  }

  try {
    const newsletter = await isUserSubscribedToNewsletter(session.user.email);
    const cleanedUser = {
      ...user,
      newsletter,
    };
    return <Content profile={cleanedUser} />;
  } catch (error) {
    Sentry.captureException(error);
    return <Content profile={user} />;
  }
}
