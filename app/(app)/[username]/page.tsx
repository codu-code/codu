import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Content from "./_usernameClient";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { feed_sources } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { JsonLd } from "@/components/JsonLd";
import { getPersonSchema } from "@/lib/structured-data";

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
    const title = `${name || username} - Codú Profile | Codú - The community for AI builders & indie hackers`;
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

  // Feed sources now live at /s/{sourceSlug} — the page redirects them, so we
  // don't emit source metadata here (the /s/ route owns it).
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
      location: true,
      topics: true,
      createdAt: true,
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

    // Prepare Person JSON-LD for SEO
    const personSchema = getPersonSchema({
      name: shapedProfile.name,
      username: shapedProfile.username,
      image: shapedProfile.image,
      bio: shapedProfile.bio,
      websiteUrl: shapedProfile.websiteUrl,
    });

    return (
      <>
        {/* Person JSON-LD for profile SEO */}
        <JsonLd data={personSchema} />

        {/* The visible profile name (rendered as <h1> in _usernameClient) is the
            single page h1 — no separate sr-only h1 to avoid duplicate headings. */}
        <Content profile={shapedProfile} isOwner={isOwner} session={session} />
      </>
    );
  }

  // The /{username} namespace is users-only. A segment that isn't a user but
  // IS a feed source 301s to its canonical /s/{sourceSlug} home.
  const source = await db.query.feed_sources.findFirst({
    columns: { slug: true },
    where: eq(feed_sources.slug, username),
  });

  if (source) {
    permanentRedirect(`/s/${username}`);
  }

  // Neither user nor source found
  notFound();
}
