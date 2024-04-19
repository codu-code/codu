import React from "react";
import { notFound } from "next/navigation";
import Content from "./_usernameClient";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;

  const profile = await db.query.user.findFirst({
    columns: {
      bio: true,
      name: true,
    },
    where: (users, { eq }) => eq(users.username, username),
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

  const profile = await db.query.user.findFirst({
    columns: {
      bio: true,
      username: true,
      name: true,
      image: true,
      id: true,
      websiteUrl: true,
    },
    with: {
      RSVP: {
        with: {
          event: {
            with: {
              community: true,
            },
          },
        },
      },
      memberships: {
        with: {
          community: {
            with: {
              members: true,
            },
          },
        },
      },
      posts: {
        columns: {
          title: true,
          excerpt: true,
          slug: true,
          readTimeMins: true,
          published: true,
          id: true,
        },
        where: (posts, { isNotNull, and, lte }) =>
          and(
            isNotNull(posts.published),
            lte(posts.published, new Date().toISOString()),
          ),
        orderBy: (posts, { desc }) => [desc(posts.published)],
      },
      BannedUsers: {
        columns: {
          id: true,
        },
      },
    },
    where: (users, { eq }) => eq(users.username, username),
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
          published: post.published,
        })),
    accountLocked,
  };

  return (
    <Content profile={shapedProfile} isOwner={isOwner} session={session} />
  );
}
