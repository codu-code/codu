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
  const title = `${name || username} - Codú Profile | Codú - The Web Developer Community`;
  const description = `${name || username}'s profile on Codú. ${bio ? `Bio: ${bio}` : "View their posts and contributions."}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: [
        {
          url: "/images/og/home-og.png",
          width: 1200,
          height: 630,
          alt: `${name || username}'s profile on Codú`,
        },
      ],
      siteName: "Codú",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og/home-og.png"],
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
    },
    where: (users, { eq }) => eq(users.username, username),
  });

  if (!profile) {
    notFound();
  }

  const bannedUser = await db.query.banned_users.findFirst({
    where: (bannedUsers, { eq }) => eq(bannedUsers.userId, profile.id),
  });

  const accountLocked = !!bannedUser;
  const session = await getServerAuthSession();
  const isOwner = session?.user?.id === profile.id;

  const shapedProfile = {
    ...profile,
    posts: accountLocked
      ? []
      : profile.posts.map((post) => ({
          ...post,
          published: post.published,
        })),
    accountLocked,
  };

  return (
    <>
      <h1 className="sr-only">{`${shapedProfile.name || shapedProfile.username}'s Coding Profile`}</h1>
      <Content profile={shapedProfile} isOwner={isOwner} session={session} />
    </>
  );
}
