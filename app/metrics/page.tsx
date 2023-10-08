import PageHeading from "@/components/PageHeading/PageHeading";
import prisma from "@/server/db/client";
import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";

const Metrics = async () => {
  const session = await getServerAuthSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    notFound();
  }

  const postsPublishedStats = await prisma.post.count({
    where: {
      published: { not: null },
    },
  });

  const postsNotPublishedStats = await prisma.post.count({
    where: {
      published: null,
    },
  });

  const userCount = await prisma.user.count();

  const tags = await prisma.postTag.findMany({
    include: {
      tag: true,
    },
  });

  const grouped = tags.reduce(
    (
      result: {
        [x: string]: {
          count: number;
          tag: string;
        };
      },
      item,
    ) => {
      const groupValue = item["tagId"];
      if (!result[groupValue]) {
        result[groupValue] = {
          count: 0,
          tag: item.tag.title,
        };
      }
      result[groupValue].count++;
      return result;
    },
    {},
  );

  const tagsWithCount = Object.keys(grouped)
    .map((key) => grouped[key])
    .sort((a, b) => (b?.count || 0) - (a?.count || 0));

  return (
    <div className="relative sm:mx-auto max-w-2xl mx-4">
      <div className="relative">
        <PageHeading>Metrics</PageHeading>
        <div className="sm:grid grid-cols-2 gap-8 mt-4">
          <div className="bg-neutral-800 p-8 border-l-4 border-l-orange-400 mb-4 sm:mb-0">
            <h2 className="font-bold text-2xl">User Count</h2>
            <p className="font-semibold text-8xl">{userCount}</p>
          </div>

          <div className="bg-neutral-800 p-8 border-l-4 border-l-pink-600 mb-4 sm:mb-0">
            <h2 className="font-bold text-2xl">Published Posts</h2>
            <p className="font-semibold text-8xl">{postsPublishedStats}</p>
          </div>

          <div className="bg-neutral-800 p-8 border-l-4 border-l-pink-600 mb-4 sm:mb-0">
            <h2 className="font-bold text-2xl">Unpublished Posts</h2>
            <p className="font-semibold text-8xl">{postsNotPublishedStats}</p>
          </div>
        </div>
        <div className="bg-neutral-800 p-8 border-l-4 border-l-orange-400 sm:mt-8">
          <h2 className="font-bold text-2xl mb-6">Tags</h2>
          {tagsWithCount.map(({ tag, count }) => (
            <p key={tag} className="font-semibold text-xl mb-1">
              {`Count: ${count} - ${tag}`}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
