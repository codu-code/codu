import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/authOptions";
import prisma from "../server/db/client";
import Layout from "../components/Layout/Layout";
import ArticlePreview from "../components/ArticlePreview/ArticlePreview";
import Head from "next/head";
import { LinkIcon } from "@heroicons/react/outline";
import { useSession } from "next-auth/react";
import { trpc } from "../utils/trpc";
import { useRouter } from "next/router";

const Profile: NextPage = ({
  profile,
  isOwner,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { mutate: banUser } = trpc.admin.ban.useMutation({
    onSettled() {
      router.reload();
    },
  });

  const { mutate: unbanUser } = trpc.admin.unban.useMutation({
    onSettled() {
      router.reload();
    },
  });

  if (!profile) return null; // Should never happen because of serverside fetch or redirect

  const { name, username, image, bio, posts, websiteUrl, id, accountLocked } =
    profile;

  const handleBanSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (accountLocked) return;

    const target = e.target as typeof e.target & {
      note: { value: string };
    };
    const note = target.note.value;

    try {
      await banUser({ userId: id, note });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Head>
        <title>{`${name} - Codú`}</title>
        <meta name="description" content={`${name}'s profile on Codú`} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="site.webmanifest" />
        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
        <link rel="shortcut icon" href="favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="browserconfig.xml" />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta
          name="image"
          property="og:image"
          content={`/api/og?title=${encodeURIComponent(
            `${name} - Codú Profile`,
          )}`}
        />
        <meta property="og:type" content="website" />
      </Head>
      <Layout>
        <div className="max-w-2xl px-4 mx-auto text-900 dark:text-white">
          <main className="flex pt-6">
            <div className="mr-4 flex-shrink-0 self-center">
              {image && (
                <img
                  className="rounded-full object-cover h-32 w-32"
                  alt={`Avatar for ${name}`}
                  src={image}
                />
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg md:text-xl font-bold mb-0">{name}</h1>
              <h2 className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">
                @{username}
              </h2>
              <p className="mt-1">{bio}</p>
              {websiteUrl && !accountLocked && (
                <Link
                  href={websiteUrl}
                  className="flex flex-row items-center"
                  target="blank"
                >
                  <LinkIcon className="h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                  <p className="mt-1 text-blue-500">
                    {getDomainFromUrl(websiteUrl)}
                  </p>
                </Link>
              )}
            </div>
          </main>
          {accountLocked ? (
            <div className="flex items-center justify-between pb-4 mt-8 text-3xl font-extrabold tracking-tight border-b sm:text-4xl text-neutral-900 dark:text-neutral-50">
              <h1>Account locked 🔒</h1>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-4 mt-8 text-3xl font-extrabold tracking-tight border-b sm:text-4xl text-neutral-900 dark:text-neutral-50">
              <h1>Published articles</h1>
              <span className="font-light">({posts.length})</span>
            </div>
          )}

          {posts.length ? (
            posts.map(
              ({ slug, title, excerpt, readTimeMins, published, id }) => {
                if (!published) return;
                return (
                  <ArticlePreview
                    key={slug}
                    slug={slug}
                    title={title}
                    excerpt={excerpt}
                    name={name}
                    username={username || ""}
                    image={image}
                    date={published}
                    readTime={readTimeMins}
                    menuOptions={
                      isOwner
                        ? [
                            {
                              label: "Edit",
                              href: `/create/${id}`,
                              postId: id,
                            },
                          ]
                        : undefined
                    }
                    showBookmark={!isOwner}
                    id={id}
                  />
                );
              },
            )
          ) : (
            <p className="font-medium py-4">Nothing published yet... 🥲</p>
          )}
        </div>
      </Layout>
      {session && session.user.role === "ADMIN" && (
        <div className="border-t-2 text-center pb-8">
          <h4 className="text-2xl mb-6 mt-4">Admin Control</h4>
          {accountLocked ? (
            <button
              onClick={() => unbanUser({ userId: id })}
              className="secondary-button"
            >
              Unban this user
            </button>
          ) : (
            <form className="flex flex-col" onSubmit={handleBanSubmit}>
              <label
                htmlFor="note"
                className="block text-sm font-medium leading-6 text-gray-700 dark:text-gray-400"
              >
                Add your reason to ban the user
              </label>
              <div className="mt-2">
                <textarea
                  rows={4}
                  name="note"
                  id="note"
                  className="block w-full rounded-md border-0 py-1.5  shadow-sm ring-1 ring-inset ring-gray-900 dark:ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6"
                  defaultValue={""}
                />
              </div>
              <button type="submit" className="mt-4 secondary-button">
                Ban user
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ username: string }>,
) => {
  const username = context.params?.username;

  if (!username) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }

  const session = await getServerSession(context.req, context.res, authOptions);

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
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }

  const accountLocked = !!profile.BannedUsers;

  type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
    Partial<Type>;

  type Profile = typeof profile;
  const cleanedProfile: MakeOptional<Profile, "BannedUsers"> = {
    ...profile,
  };

  delete cleanedProfile.BannedUsers;

  return {
    props: {
      profile: {
        ...cleanedProfile,
        posts: accountLocked
          ? []
          : profile.posts.map((post) => ({
              ...post,
              published: post.published?.toISOString(),
            })),
        accountLocked,
      },
      isOwner: session?.user?.username === username,
    },
  };
};

export default Profile;

function getDomainFromUrl(url: string) {
  const domain = url.replace(/(https?:\/\/)?(www.)?/i, "");
  if (domain[domain.length - 1] === "/") {
    return domain.slice(0, domain.length - 1);
  }
  return domain;
}
