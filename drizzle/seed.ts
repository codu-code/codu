import { nanoid } from "nanoid";
import { Chance } from "chance";
import { post, user, tag, like, post_tag, session } from "../server/db/schema";
import { sql, eq } from "drizzle-orm";

import "dotenv/config";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const client = postgres(DATABASE_URL, { max: 1 });
const db: PostgresJsDatabase = drizzle(client);

// By passing a number we get a repeatable source of random generation.
const main = async () => {
  const chance = new Chance(1);

  const sampleTags = [
    "JAVASCRIPT",
    "WEB DEVELOPMENT",
    "TUTORIAL",
    "PRODUCTIVITY",
    "CSS",
    "TERMINAL",
    "DJANGO",
    "PYTHON",
    "TIPS",
    "BACKEND",
  ];

  const randomPosts = (count = 10) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const title = chance.sentence({
          words: chance.integer({ min: 4, max: 8 }),
        });
        return {
          id: nanoid(8),
          title: title,
          published: chance.pickone([
            new Date(chance.date({ year: 2023 })).toISOString(),
            undefined,
          ]),
          excerpt: chance.sentence({
            words: chance.integer({ min: 10, max: 20 }),
          }),
          updatedAt: new Date().toISOString(),
          slug: `${title
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "")}-${chance.string({
            length: 5,
            alpha: true,
            casing: "lower",
          })}`,
          likes: chance.integer({ min: 0, max: 1000 }),
          readTimeMins: chance.integer({ min: 1, max: 10 }),
          // The body needs this indentation or it all appears as codeblocks when rendered
          body: `Hello world -
${chance.paragraph()}
## ${chance.sentence({ words: 6 })}

- ${chance.sentence({ words: 3 })}
- ${chance.sentence({ words: 2 })}
- ${chance.sentence({ words: 3 })}
- ${chance.sentence({ words: 4 })}

${chance.paragraph()} If you want to try a link click this [test link](https://www.codu.co/). ${chance.paragraph()}

${"```"}

function test() {
   console.log("notice the blank line before this function?");
}
${"```"}

${chance.paragraph()}
        `,
        };
      });
  };

  const generateUserData = (count = 100) => {
    const users = Array(count)
      .fill(null)
      .map(() => {
        const name = chance.name();
        return {
          username: `${name.split(" ").join("-").toLowerCase()}-${chance.integer(
            {
              min: 0,
              max: 999,
            },
          )}`,
          name,
          email: chance.email(),
          image: `https://robohash.org/${encodeURIComponent(name)}?bgset=bg1`,
          location: chance.country({ full: true }),
          bio: chance.sentence({ words: 10 }),
          websiteUrl: chance.url(),
        };
      });

    return users;
  };

  const userData = generateUserData();

  const addUserData = async () => {
    const tags = sampleTags.map((title) => ({ title }));

    const tagResponse = await db
      .insert(tag)
      .values(tags)
      .onConflictDoNothing()
      .returning({ id: tag.id, title: tag.title });

    const usersResponse = await db.insert(user).values(userData).returning();

    for (let i = 0; i < usersResponse.length; i++) {
      const posts = randomPosts(
        chance.integer({
          min: 1,
          max: 5,
        }),
      ).map((post) => ({ ...post, userId: usersResponse[i].id }));

      const postsResponse = await db
        .insert(post)
        .values(posts)
        .onConflictDoNothing()
        .returning();

      for (let j = 0; j < postsResponse.length; j++) {
        const randomTag = tagResponse[chance.integer({ min: 0, max: 9 })];
        await db
          .insert(post_tag)
          .values({ postId: postsResponse[j].id, tagId: randomTag.id })
          .onConflictDoNothing();
      }
    }

    const posts = await db.select().from(post);

    for (let i = 0; i < usersResponse.length; i++) {
      const numberOfLikedPosts = chance.integer({
        min: 1,
        max: posts.length / 2,
      });

      const likedPosts: Array<string> = [];

      for (let j = 0; j < numberOfLikedPosts; j++) {
        likedPosts.push(
          posts[
            chance.integer({
              min: 0,
              max: posts.length - 1,
            })
          ].id,
        );
      }

      await Promise.all(
        likedPosts.map((post) =>
          db
            .insert(like)
            .values({ userId: usersResponse[i].id, postId: post })
            .onConflictDoNothing(),
        ),
      );
    }

    console.log(`Added ${usersResponse.length} users with posts and likes`);
  };

  async function addSeedDataToDb() {
    console.log(`Start seeding, please wait... `);

    try {
      await addUserData();
    } catch (error) {
      console.log("Error:", error);
    }

    console.log(`Seeding finished.`);
    process.exit(0);
  }

  async function deleteDataFromAllTables() {
    const query = sql<string>`SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;

    const tables = await db.execute(query); // retrieve tables

    for (const table of tables) {
      try {
        const query =
          await sql`DELETE FROM "${sql.raw(table.table_name as string)}" CASCADE;`;
        await db.execute(query);
        console.log("Delete", table.table_name);
        console.log(`Skipping ${table.table_name}`);
      } catch (error) {
        console.log(`Error deleting ${table.table_name}: ${error}`);
      }
    }

    console.log(`Database emptied`);
  }

  if (process.env.NODE_ENV !== "production") {
    await deleteDataFromAllTables();
    await addSeedDataToDb();
  } else {
    console.log(
      "This script is only for development, it will delete all of your data.",
    );
  }
};

main();
