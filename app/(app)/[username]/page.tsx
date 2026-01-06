import React from "react";
import { notFound } from "next/navigation";
import Content from "./_usernameClient";
import SourceProfileContent from "./_sourceProfileClient";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { feed_sources } from "@/server/db/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const username = params.username;

  // First check if it's a user
  const profile = await db.query.user.findFirst({
    columns: {
      bio: true,
      name: true,
    },
    where: (users, { eq }) => eq(users.username, username),
  });

  if (profile) {
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

  // Check if it's a feed source
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, username),
  });

  if (source) {
    return {
      title: `${source.name} | Codú Feed`,
      description:
        source.description || `Articles from ${source.name} on Codú Feed`,
      openGraph: {
        title: source.name,
        description:
          source.description || `Articles from ${source.name} on Codú Feed`,
        images: source.logoUrl ? [source.logoUrl] : undefined,
      },
    };
  }

  // Neither user nor source found
  return { title: "Profile Not Found" };
}

export default async function Page(props: {
  params: Promise<{ username: string }>;
}) {
  const params = await props.params;
  const username = params?.username;

  if (!username) {
    notFound();
  }

  // First check if it's a user
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
          readingTime: true,
          publishedAt: true,
          id: true,
        },
        where: (posts, { eq, and, lte }) =>
          and(
            eq(posts.status, "published"),
            lte(posts.publishedAt, new Date().toISOString()),
          ),
        orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      },
    },
    where: (users, { eq }) => eq(users.username, username),
  });

  if (profile) {
    const bannedUser = await db.query.banned_users.findFirst({
      where: (bannedUsers, { eq }) => eq(bannedUsers.userId, profile.id),
    });

    const accountLocked = !!bannedUser;
    const session = await getServerAuthSession();
    const isOwner = session?.user?.id === profile.id;

    const shapedProfile = {
      ...profile,
      posts: accountLocked ? [] : profile.posts,
      accountLocked,
    };

    return (
      <>
        <h1 className="sr-only">{`${shapedProfile.name || shapedProfile.username}'s Coding Profile`}</h1>
        <Content profile={shapedProfile} isOwner={isOwner} session={session} />
      </>
    );
  }

  // Check if it's a feed source
  const source = await db.query.feed_sources.findFirst({
    where: eq(feed_sources.slug, username),
  });

  if (source) {
    return <SourceProfileContent sourceSlug={username} />;
  }

  // Neither user nor source found
  notFound();
}
