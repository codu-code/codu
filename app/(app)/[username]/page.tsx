import React from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Content from "./_usernameClient";
import { getServerAuthSession } from "@/server/auth";
import { type Metadata } from "next";
import { db } from "@/server/db";
import { feed_sources, follow } from "@/server/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { JsonLd } from "@/components/JsonLd";
import { getProfilePageSchema } from "@/lib/structured-data";
import { ogProfileImage } from "@/lib/og/url";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const username = params.username;

  // Case-insensitive handle resolution (GitHub-style) on lower(username).
  const profile = await db.query.user.findFirst({
    columns: {
      id: true,
      bio: true,
      name: true,
      username: true,
      location: true,
      jobTitle: true,
      topics: true,
      createdAt: true,
      updatedAt: true,
    },
    where: (users) => sql`lower(${users.username}) = ${username.toLowerCase()}`,
  });

  if (profile) {
    const { bio, name } = profile;
    const handle = profile.username ?? username;
    // Short enough to survive SERP truncation (~60 chars).
    const title = `${name || handle} (@${handle}) | Codú`;
    const description = `${name || handle}'s profile on Codú. ${bio ? `Bio: ${bio}` : "View their posts and contributions."}`;

    const [followerRow] = await db
      .select({ value: count() })
      .from(follow)
      .where(eq(follow.followingId, profile.id));
    const joined = `Joined ${new Date(profile.createdAt).toLocaleString("en-US", { month: "short", year: "numeric" })}`;
    const ogImage = ogProfileImage({
      name: name || handle,
      key: handle,
      role: profile.jobTitle,
      location: profile.location,
      bio,
      followers: followerRow?.value ?? 0,
      joined,
      interests: profile.topics,
      updatedAt: profile.updatedAt,
    });

    return {
      title,
      description,
      // Canonical at the stored handle casing (mixed-case requests 301 anyway;
      // this guards query-param duplicates).
      alternates: { canonical: `/${handle}` },
      openGraph: {
        title,
        description,
        type: "profile",
        images: [
          {
            url: ogImage,
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
        images: [ogImage],
      },
    };
  }

  // Feed sources live at /s/{sourceSlug} (the /s/ route owns their metadata).
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
    // Case-insensitive handle resolution (GitHub-style).
    where: (users) => sql`lower(${users.username}) = ${username.toLowerCase()}`,
  });

  if (profile) {
    // Canonicalize casing: 301 to the handle's stored display casing so there's
    // one indexable URL per profile.
    if (profile.username && profile.username !== username) {
      permanentRedirect(`/${profile.username}`);
    }

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

    // ProfilePage JSON-LD (wraps a Person mainEntity) for profile SEO.
    const profilePageSchema = getProfilePageSchema({
      name: shapedProfile.name,
      username: shapedProfile.username,
      image: shapedProfile.image,
      bio: shapedProfile.bio,
      websiteUrl: shapedProfile.websiteUrl,
      createdAt: shapedProfile.createdAt,
    });

    return (
      <>
        <JsonLd data={profilePageSchema} />

        {/* The visible profile name (rendered as <h1> in _usernameClient) is the
            single page h1 — no separate sr-only h1 to avoid duplicate headings. */}
        <Content profile={shapedProfile} isOwner={isOwner} session={session} />
      </>
    );
  }

  // /{username} is users-only: a non-user segment that IS a feed source 301s to /s/.
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
