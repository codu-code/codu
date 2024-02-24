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
    <div className="relative mx-4 max-w-2xl sm:mx-auto">
      <div className="relative">
        <PageHeading>Metrics</PageHeading>
        <div className="mt-4 grid-cols-2 gap-8 sm:grid">
          <div className="mb-4 border-l-4 border-l-orange-400 bg-neutral-800 p-8 sm:mb-0">
            <h2 className="text-2xl font-bold">User Count</h2>
            <p className="text-8xl font-semibold">{userCount}</p>
          </div>

          <div className="mb-4 border-l-4 border-l-pink-600 bg-neutral-800 p-8 sm:mb-0">
            <h2 className="text-2xl font-bold">Published Posts</h2>
            <p className="text-8xl font-semibold">{postsPublishedStats}</p>
          </div>

          <div className="mb-4 border-l-4 border-l-pink-600 bg-neutral-800 p-8 sm:mb-0">
            <h2 className="text-2xl font-bold">Unpublished Posts</h2>
            <p className="text-8xl font-semibold">{postsNotPublishedStats}</p>
          </div>
        </div>
        <div className="border-l-4 border-l-orange-400 bg-neutral-800 p-8 sm:mt-8">
          <h2 className="mb-6 text-2xl font-bold">Tags</h2>
          {tagsWithCount.map(({ tag, count }) => (
            <p key={tag} className="mb-1 text-xl font-semibold">
              {`Count: ${count} - ${tag}`}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
