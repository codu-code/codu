import React from "react";
import prisma from "@/server/db/client";

import { notFound } from "next/navigation";
import Content from "./_usernameClient";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;

  const profile = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      bio: true,
      name: true,
    },
  });

  if (!profile) {
    notFound();
  }

  const { bio, name } = profile;
  const title = `@${username} ${name ? `(${name}) -` : " -"} Codú`;

  const description = `Read writing from ${name}. ${bio}`;

  return {
    title,
    description,
    openGraph: {
      description,
      type: "article",
      images: [`/api/og?title=${encodeURIComponent(`${name} on Codú`)}`],
      siteName: "Codú",
    },
    twitter: {
      description,
      images: [`/api/og?title=${encodeURIComponent(`${name} on Codú`)}`],
    },
  };
}

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
      RSVP: {
        select: {
          event: {
            include: {
              community: true,
            },
          },
        },
      },
      memberships: {
        select: {
          community: {
            include: {
              members: true,
            },
          },
        },
      },
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
