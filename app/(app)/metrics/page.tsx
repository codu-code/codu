import PageHeading from "@/components/PageHeading/PageHeading";
import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";
import { post, post_tag, tag, user } from "@/server/db/schema";
import { count, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/server/db";

const Metrics = async () => {
  const session = await getServerAuthSession();
  const currentUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, session?.user?.id ?? ""),
  });

  const isAdmin = currentUser?.role === "ADMIN";

  if (!isAdmin) {
    notFound();
  }

  const [postsPublishedStats] = await db
    .select({ count: count() })
    .from(post)
    .where(isNotNull(post.published));

  const [postsNotPublishedStats] = await db
    .select({ count: count() })
    .from(post)
    .where(isNull(post.published));

  const [users] = await db.select({ count: count() }).from(user);

  const tags = await db
    .select()
    .from(post_tag)
    .leftJoin(tag, eq(tag.id, post_tag.tagId));

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
      const groupValue = item.Tag!.id;
      if (!result[groupValue]) {
        result[groupValue] = {
          count: 0,
          tag: item.Tag!.title,
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
            <p className="text-8xl font-semibold">{users.count}</p>
          </div>

          <div className="mb-4 border-l-4 border-l-pink-600 bg-neutral-800 p-8 sm:mb-0">
            <h2 className="text-2xl font-bold">Published Posts</h2>
            <p className="text-8xl font-semibold">
              {postsPublishedStats.count}
            </p>
          </div>

          <div className="mb-4 border-l-4 border-l-pink-600 bg-neutral-800 p-8 sm:mb-0">
            <h2 className="text-2xl font-bold">Unpublished Posts</h2>
            <p className="text-8xl font-semibold">
              {postsNotPublishedStats.count}
            </p>
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
