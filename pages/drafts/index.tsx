import { NextPage, GetServerSideProps } from "next";
import { unstable_getServerSession } from "next-auth";
import Layout from "../../components/Layout/Layout";
import { authOptions } from "../api/auth/[...nextauth]";
import { trpc } from "../../utils/trpc";
import Link from "next/link";

const Drafts: NextPage = () => {
  const { data, status } = trpc.useQuery(["post.drafts"]);

  return (
    <Layout>
      <div className="border-t-2">
        <div className="max-w-xl px-4 mx-auto text-white">
          <div className="pb-3 border-b border-gray-200 pt-8 mb-4">
            <h1 className="text-2xl leading-6 font-medium">Drafts</h1>
          </div>
          <div>
            {status === "loading" && <p>Fetching your drafts...</p>}
            {status === "error" && (
              <p>Something went wrong... Refresh the page.</p>
            )}
            {status === "success" &&
              data.length &&
              data.map(({ id, title, excerpt, readTimeMins, slug }) => (
                <article className="border-2 p-4 mb-4" key={id}>
                  <h2 className=" text-2xl font-semibold mb-2">{title}</h2>
                  <p>{excerpt || "No excerpt yet... Write more to see one."}</p>
                  <p className="mt-2 font-light text-sm text-gray-400">
                    Read time so far: {readTimeMins} mins
                  </p>
                  <div className="flex justify-end">
                    <Link href={`/create/${slug}`}>
                      <a className="fancy-link">Edit</a>
                    </Link>
                  </div>
                </article>
              ))}
            {status === "success" && data.length === 0 && (
              <p className="font-medium py-4">Nothing published yet... 🥲</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Drafts;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
