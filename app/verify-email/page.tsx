import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import React from "react";
import Content from "./_client";
import { db } from "@/server/db";

export const metadata = {
  title: "Verify Email",
};

export default async function Page() {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect("/not-found");
  }

  const existingUser = await db.query.user.findFirst({
    columns: {
      id: true,
    },
    where: (users, { eq }) => eq(users.id, session.user!.id),
  });

  if (!existingUser) {
    redirect("/not-found");
  }

  return <Content />;
}
