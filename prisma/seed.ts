import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { Chance } from "chance";

const prisma = new PrismaClient();
// By passing a number we get a repeatable source of random generation.
const chance = new Chance(1);

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

async function main() {
  console.log(`Start seeding, please wait...`);
  userData.forEach(async (user) => {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Added user: ${user.username}`);
  });
  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
