import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";

import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "../server/db/client";
import Layout from "../components/Layout/Layout";
import ArticlePreview from "../components/ArticlePreview/ArticlePreview";
import PageHeading from "../components/PageHeading/PageHeading";

const Profile: NextPage = ({
  profile,
  isOwner,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!profile) return null; // Should never happen because of serverside fetch or redirect

  const { name, username, image, bio, posts } = profile;

  return (
    <Layout>
      <div className="border-t-2">
        <div className="max-w-2xl px-4 mx-auto text-white">
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
              <h2 className="text-gray-400 font-bold text-sm">@{username}</h2>
              <p className="mt-1">{bio}</p>
            </div>
          </main>

          <PageHeading>Published articles</PageHeading>

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
                        ? [{ label: "Edit", href: `/create/${id}`, postId: id }]
                        : undefined
                    }
                    showBookmark={!isOwner}
                    id={id}
                  />
                );
              }
            )
          ) : (
            <p className="font-medium py-4">Nothing published yet... 🥲</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ username: string }>
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

  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  const profile = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      bio: true,
      username: true,
      name: true,
      image: true,
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

  return {
    props: {
      profile: {
        ...profile,
        posts: profile.posts.map((post) => ({
          ...post,
          published: post.published?.toISOString(),
        })),
      },
      isOwner: session?.user?.username === username,
    },
  };
};

export default Profile;
