import { Children } from "react";
import type {
  NextPage,
  GetServerSideProps,
  InferGetServerSidePropsType,
} from "next";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth";
import ArticlePreview from "../../components/ArticlePreview/ArticlePreview";
import Layout from "../../components/Layout/Layout";
import { authOptions } from "../../app/api/auth/authOptions";
import { trpc } from "../../utils/trpc";
import PageHeading from "../../components/PageHeading/PageHeading";
import ArticleLoading from "../../components/ArticlePreview/ArticleLoading";

const MyPosts: NextPage = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  if (!userId) router.push("/get-started");

  const {
    data: bookmarks,
    refetch,
    status: bookmarkStatus,
  } = trpc.post.myBookmarks.useQuery();

  const { mutate: bookmark } = trpc.post.bookmark.useMutation({
    onSettled() {
      refetch();
    },
  });

  const removeSavedItem = async (postId: string) => {
    try {
      await bookmark({ postId, setBookmarked: false });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="relative sm:mx-auto max-w-2xl mx-4">
        <PageHeading>Saved items</PageHeading>
        <div>
          {bookmarkStatus === "loading" &&
            Children.toArray(
              Array.from({ length: 7 }, () => {
                return <ArticleLoading />;
              }),
            )}
          {bookmarkStatus === "error" && (
            <p className="font-medium py-4">
              Something went wrong fetching your saved posts... Refresh the
              page.
            </p>
          )}

          {bookmarkStatus === "success" &&
            bookmarks.map(
              ({
                id,
                slug,
                title,
                excerpt,
                user: { name, image, username },
                updatedAt,
                readTimeMins,
              }) => {
                return (
                  <ArticlePreview
                    key={id}
                    id={id}
                    username={username || ""}
                    slug={slug}
                    title={title}
                    excerpt={excerpt}
                    name={name}
                    image={image}
                    date={updatedAt.toISOString()}
                    readTime={readTimeMins}
                    showBookmark={false}
                    menuOptions={[
                      {
                        label: "Remove item",
                        postId: id,
                        onClick: () => removeSavedItem(id),
                      },
                    ]}
                  />
                );
              },
            )}

          {bookmarkStatus === "success" && bookmarks?.length === 0 && (
            <p className="font-medium py-4">
              Your saved posts will show up here.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyPosts;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {
      userId: session.user?.id,
    },
  };
};
