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

const Profile: NextPage = ({
  profile,
  isOwner,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  if (!profile) return null; // Should never happen because of serverside fetch or redirect

  const { name, username, image, bio, posts } = profile;

  return (
    <Layout>
      <div className="border-t-2">
        <div className="max-w-xl px-4 mx-auto text-white">
          <main className="flex pt-6">
            <div className="mr-4 flex-shrink-0 self-center">
              {image && (
                <img
                  className="rounded-full h-28 w-28"
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
          <div className="pb-3 border-b border-gray-200 pt-8">
            <h3 className="text-2xl leading-6 font-medium">
              Published articles
            </h3>
          </div>
          {posts ? (
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
                    image={image}
                    date={published}
                    readTime={readTimeMins}
                    canEdit={isOwner}
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
