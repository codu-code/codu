import { Prisma, PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { Chance } from "chance";

const prisma = new PrismaClient();
// By passing a number we get a repeatable source of random generation.
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
        eventDate: chance.date(),
        address: chance.address(),
        coverImage: chance.avatar({ protocol: "https" }),
        capacity: chance.integer({ min: 1, max: 100 }),
        name: name,
        description: chance.sentence({
          words: chance.integer({ min: 200, max: 1000 }),
        }),
        slug,
      };
    });
};

const generateCommunityData = (count: number) => {
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
        events: {
          create: generateEventData(
            chance.integer({
              min: 1,
              max: 5,
            }),
          ),
        },
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
        published: chance.pickone([chance.date({ year: 2020 }), undefined]),
        excerpt: chance.sentence({
          words: chance.integer({ min: 10, max: 20 }),
        }),
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
        username: `${name.split(" ").join("-").toLowerCase()}-${chance.integer({
          min: 0,
          max: 999,
        })}`,
        name,
        email: chance.email(),
        image: chance.avatar({ protocol: "https" }),
        location: chance.country({ full: true }),
        bio: chance.sentence({ words: 10 }),
        websiteUrl: chance.url(),
        posts: {
          create: randomPosts(
            chance.integer({
              min: 1,
              max: 5,
            }),
          ),
        },
      };
    });

  return users;
};

const userData = generateUserData();
const communityData = generateCommunityData(10);

async function addSeedDataToDb() {
  console.log(`Start seeding, please wait...`);
  userData.forEach(async (user) => {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Added user: ${user.username}`);
  });
  communityData.forEach(async (community) => {
    await prisma.community.upsert({
      where: { id: community.id },
      update: {},
      create: community,
    });
    console.log(`Added community: ${community.name}`);
  });

  const users = await prisma.user.findMany();
  communityData.forEach(async (community) => {
    users.forEach(async (user, index) => {
      const id = nanoid(8);
      await prisma.membership.create({
        data: {
          id: id,
          userId: user.id,
          communityId: community.id,
          isEventOrganiser: index === 0,
        },
      });
      console.log(`Added membership: ${id}`);
    });
  });

  const events = await prisma.event.findMany();
  events.forEach((event) => {
    users.forEach(async (user) => {
      const id = nanoid(8);
      await prisma.rSVP.create({
        data: {
          id: id,
          userId: user.id,
          eventId: event.id,
        },
      });
      console.log(`Added RSVP: ${id}`);
    });
  });

  console.log(`Seeding finished.`);
}

async function deleteDataFromAllTables() {
  const models = Object.keys(prisma) as (keyof typeof prisma)[];

  for (const model of models) {
    const modelInstance = prisma[model] as {
      deleteMany?: (
        options?: Prisma.UserDeleteManyArgs,
      ) => Prisma.PrismaPromise<Prisma.BatchPayload>;
    };

    if (modelInstance?.deleteMany) {
      await modelInstance.deleteMany({});
    }
  }
  await prisma.$disconnect();
}

deleteDataFromAllTables()
  .then(() => {
    console.log("Data deleted");
    addSeedDataToDb();
  })
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
