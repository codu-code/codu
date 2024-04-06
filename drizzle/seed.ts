import { nanoid } from "nanoid";
import { Chance } from "chance";
import {
  post,
  user,
  tag,
  like,
  post_tag,
  community,
  membership,
  event,
  r_s_v_p,
} from "../server/db/schema";
import { sql } from "drizzle-orm";

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

  const generateEventData = (count: number) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const name = chance.sentence({
          words: chance.integer({ min: 4, max: 8 }),
        });
        const slug = `${name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")}-${nanoid(8)}`;
        return {
          id: nanoid(8),
          eventDate: chance.date().toISOString(),
          address: chance.address(),
          coverImage: chance.avatar({ protocol: "https" }),
          capacity: chance.integer({ min: 1, max: 100 }),
          name: name,
          description: chance.sentence({
            words: chance.integer({ min: 200, max: 1000 }),
          }),
          slug,
          updatedAt: new Date().toISOString(),
        };
      });
  };

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

  const generateCommunityData = (count: number) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const name = chance.sentence({
          words: chance.integer({ min: 4, max: 6 }),
        });
        const slug = `${name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")}-${nanoid(8)}`;
        return {
          id: nanoid(8),
          name: name,
          city: chance.city(),
          country: chance.country({ full: true }),
          coverImage: chance.avatar({ protocol: "https" }),
          description: chance.sentence({
            words: chance.integer({ min: 200, max: 1000 }),
          }),
          excerpt: chance.sentence({
            words: chance.integer({ min: 10, max: 20 }),
          }),
          slug,
        };
      });
  };

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
  const communityData = generateCommunityData(10);

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
        max: posts.length,
      });

      const likedPosts: Array<string> = [];

      for (let j = 0; j < numberOfLikedPosts; j++) {
        // const postToLike =
        //   posts[
        //     chance.integer({
        //       min: 0,
        //       max: posts.length - 1,
        //     })
        //   ].id;
        likedPosts.push(
          posts[
            chance.integer({
              min: 0,
              max: posts.length - 1,
            })
          ].id,
        );
        // if (!likedPosts.find((post) => post === postToLike)) {
        //   likedPosts.push(postToLike);
        // }
      }

      console.log(
        `Adding ${likedPosts.length} likes for user ${usersResponse[i].email}`,
      );

      for (let j = 0; j < likedPosts.length; j++) {
        await db
          .insert(like)
          .values({ userId: usersResponse[i].id, postId: likedPosts[j] })
          .onConflictDoNothing();
      }
    }

    console.log(`Added ${usersResponse.length} users with posts`);
  };

  const addEventData = async () => {
    const communityResponse = await db
      .insert(community)
      .values(communityData)
      .returning();

    const allUsers = await db.select().from(user);

    for (let i = 0; i < communityResponse.length; i++) {
      const eventData = generateEventData(
        chance.integer({
          min: 1,
          max: 5,
        }),
      ).map((event) => ({
        ...event,
        communityId: communityResponse[i].id,
      }));

      const community = communityResponse[i];
      const membershipData = allUsers.map((user) => ({
        id: nanoid(8),
        userId: user.id,
        communityId: community.id,
        isEventOrganiser: user.id === allUsers[0].id,
      }));

      await db.insert(membership).values(membershipData).returning();
      const eventsResponse = await db
        .insert(event)
        .values(eventData)
        .returning();

      for (let j = 0; j < eventsResponse.length; j++) {
        const eventData = eventsResponse[j];
        for (let k = 0; k < allUsers.length; k++) {
          const userData = allUsers[j];
          const id = nanoid(8);
          await db
            .insert(r_s_v_p)
            .values({ eventId: eventData.id, id, userId: userData.id })
            .onConflictDoNothing();
        }
      }
    }

    console.log(`Added events and members`);
  };

  async function addSeedDataToDb() {
    console.log(`Start seeding, please wait... `);

    try {
      await addUserData();
      await addEventData();
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
