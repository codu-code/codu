import type {
  NextPage,
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { useRouter } from "next/router";

import superjson from "superjson";
import Layout from "../components/Layout/Layout";
import ArticlePreview from "../components/ArticlePreview/ArticlePreview";
import PageHeading from "../components/PageHeading/PageHeading";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "../server/trpc/router";
import { createContextInner } from "../server/trpc/context";
import { getServerAuthSession } from "../server/common/get-server-auth-session";
import { trpc } from "../utils/trpc";

const Profile: NextPage = ({
  isOwner,
  profileRoute,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  const { data: profile } = trpc.profile.get.useQuery(
    {
      username: profileRoute || "",
    },
    {
      retry: false,
      onError: () => {
        router.push("/404");
      },
    }
  );

  // @TODO Can be made more elegant later
  if (!profile) return null;

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
                    date={published.toISOString()}
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
  ctx: GetServerSidePropsContext<{ username: string }>
) => {
  const username = ctx.params?.username;

  if (!username) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
      props: {},
    };
  }

  const session = await getServerAuthSession(ctx);

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({
      session,
    }),
    transformer: superjson,
  });

  await ssg.profile.get.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      isOwner: session?.user?.username === username,
      profileRoute: username,
    },
  };
};

export default Profile;
