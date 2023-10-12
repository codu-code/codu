import React from "react";
import prisma from "@/server/db/client";

import { notFound, redirect } from "next/navigation";
import Content from "./_usernameClient";
import { getServerAuthSession } from "@/server/auth";
import { customAlphabet } from "nanoid";

// @TODO - Maybe add Metadata for this page

export default async function Page({
  params,
}: {
  params: { username: string };
}) {
  const username = params?.username;

  if (!username) {
    notFound();
  }

  const profile = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      bio: true,
      username: true,
      name: true,
      image: true,
      id: true,
      websiteUrl: true,
      posts: {
        where: {
          NOT: {
            published: null,
          },
        },
        orderBy: {
          published: "desc",
        },
        select: {
          title: true,
          excerpt: true,
          slug: true,
          readTimeMins: true,
          published: true,
          id: true,
        },
      },
      BannedUsers: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const accountLocked = !!profile.BannedUsers;
  const session = await getServerAuthSession();
  const isOwner = session?.user?.username === username;

  type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
    Partial<Type>;

  type Profile = typeof profile;
  const cleanedProfile: MakeOptional<Profile, "BannedUsers"> = {
    ...profile,
  };

  delete cleanedProfile.BannedUsers;

  const shapedProfile = {
    ...cleanedProfile,
    posts: accountLocked
      ? []
      : profile.posts.map((post) => ({
          ...post,
          published: post.published?.toISOString(),
        })),
    accountLocked,
  };

  return (
    <Content profile={shapedProfile} isOwner={isOwner} session={session} />
  );
}
