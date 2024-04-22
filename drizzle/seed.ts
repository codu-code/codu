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

// chance.js only gives you full country name or abbreviation I need both
// opening a PR to give this option in change.js
const countries = [
  { name: "Afghanistan", abbreviation: "AF" },
  { name: "Åland Islands", abbreviation: "AX" },
  { name: "Albania", abbreviation: "AL" },
  { name: "Algeria", abbreviation: "DZ" },
  { name: "American Samoa", abbreviation: "AS" },
  { name: "Andorra", abbreviation: "AD" },
  { name: "Angola", abbreviation: "AO" },
  { name: "Anguilla", abbreviation: "AI" },
  { name: "Antarctica", abbreviation: "AQ" },
  { name: "Antigua & Barbuda", abbreviation: "AG" },
  { name: "Argentina", abbreviation: "AR" },
  { name: "Armenia", abbreviation: "AM" },
  { name: "Aruba", abbreviation: "AW" },
  { name: "Ascension Island", abbreviation: "AC" },
  { name: "Australia", abbreviation: "AU" },
  { name: "Austria", abbreviation: "AT" },
  { name: "Azerbaijan", abbreviation: "AZ" },
  { name: "Bahamas", abbreviation: "BS" },
  { name: "Bahrain", abbreviation: "BH" },
  { name: "Bangladesh", abbreviation: "BD" },
  { name: "Barbados", abbreviation: "BB" },
  { name: "Belarus", abbreviation: "BY" },
  { name: "Belgium", abbreviation: "BE" },
  { name: "Belize", abbreviation: "BZ" },
  { name: "Benin", abbreviation: "BJ" },
  { name: "Bermuda", abbreviation: "BM" },
  { name: "Bhutan", abbreviation: "BT" },
  { name: "Bolivia", abbreviation: "BO" },
  { name: "Bosnia & Herzegovina", abbreviation: "BA" },
  { name: "Botswana", abbreviation: "BW" },
  { name: "Brazil", abbreviation: "BR" },
  { name: "British Indian Ocean Territory", abbreviation: "IO" },
  { name: "British Virgin Islands", abbreviation: "VG" },
  { name: "Brunei", abbreviation: "BN" },
  { name: "Bulgaria", abbreviation: "BG" },
  { name: "Burkina Faso", abbreviation: "BF" },
  { name: "Burundi", abbreviation: "BI" },
  { name: "Cambodia", abbreviation: "KH" },
  { name: "Cameroon", abbreviation: "CM" },
  { name: "Canada", abbreviation: "CA" },
  { name: "Canary Islands", abbreviation: "IC" },
  { name: "Cape Verde", abbreviation: "CV" },
  { name: "Caribbean Netherlands", abbreviation: "BQ" },
  { name: "Cayman Islands", abbreviation: "KY" },
  { name: "Central African Republic", abbreviation: "CF" },
  { name: "Ceuta & Melilla", abbreviation: "EA" },
  { name: "Chad", abbreviation: "TD" },
  { name: "Chile", abbreviation: "CL" },
  { name: "China", abbreviation: "CN" },
  { name: "Christmas Island", abbreviation: "CX" },
  { name: "Cocos (Keeling) Islands", abbreviation: "CC" },
  { name: "Colombia", abbreviation: "CO" },
  { name: "Comoros", abbreviation: "KM" },
  { name: "Congo - Brazzaville", abbreviation: "CG" },
  { name: "Congo - Kinshasa", abbreviation: "CD" },
  { name: "Cook Islands", abbreviation: "CK" },
  { name: "Costa Rica", abbreviation: "CR" },
  { name: "Côte d'Ivoire", abbreviation: "CI" },
  { name: "Croatia", abbreviation: "HR" },
  { name: "Cuba", abbreviation: "CU" },
  { name: "Curaçao", abbreviation: "CW" },
  { name: "Cyprus", abbreviation: "CY" },
  { name: "Czech Republic", abbreviation: "CZ" },
  { name: "Denmark", abbreviation: "DK" },
  { name: "Diego Garcia", abbreviation: "DG" },
  { name: "Djibouti", abbreviation: "DJ" },
  { name: "Dominica", abbreviation: "DM" },
  { name: "Dominican Republic", abbreviation: "DO" },
  { name: "Ecuador", abbreviation: "EC" },
  { name: "Egypt", abbreviation: "EG" },
  { name: "El Salvador", abbreviation: "SV" },
  { name: "Equatorial Guinea", abbreviation: "GQ" },
  { name: "Eritrea", abbreviation: "ER" },
  { name: "Estonia", abbreviation: "EE" },
  { name: "Ethiopia", abbreviation: "ET" },
  { name: "Falkland Islands", abbreviation: "FK" },
  { name: "Faroe Islands", abbreviation: "FO" },
  { name: "Fiji", abbreviation: "FJ" },
  { name: "Finland", abbreviation: "FI" },
  { name: "France", abbreviation: "FR" },
  { name: "French Guiana", abbreviation: "GF" },
  { name: "French Polynesia", abbreviation: "PF" },
  { name: "French Southern Territories", abbreviation: "TF" },
  { name: "Gabon", abbreviation: "GA" },
  { name: "Gambia", abbreviation: "GM" },
  { name: "Georgia", abbreviation: "GE" },
  { name: "Germany", abbreviation: "DE" },
  { name: "Ghana", abbreviation: "GH" },
  { name: "Gibraltar", abbreviation: "GI" },
  { name: "Greece", abbreviation: "GR" },
  { name: "Greenland", abbreviation: "GL" },
  { name: "Grenada", abbreviation: "GD" },
  { name: "Guadeloupe", abbreviation: "GP" },
  { name: "Guam", abbreviation: "GU" },
  { name: "Guatemala", abbreviation: "GT" },
  { name: "Guernsey", abbreviation: "GG" },
  { name: "Guinea", abbreviation: "GN" },
  { name: "Guinea-Bissau", abbreviation: "GW" },
  { name: "Guyana", abbreviation: "GY" },
  { name: "Haiti", abbreviation: "HT" },
  { name: "Honduras", abbreviation: "HN" },
  { name: "Hong Kong SAR China", abbreviation: "HK" },
  { name: "Hungary", abbreviation: "HU" },
  { name: "Iceland", abbreviation: "IS" },
  { name: "India", abbreviation: "IN" },
  { name: "Indonesia", abbreviation: "ID" },
  { name: "Iran", abbreviation: "IR" },
  { name: "Iraq", abbreviation: "IQ" },
  { name: "Ireland", abbreviation: "IE" },
  { name: "Isle of Man", abbreviation: "IM" },
  { name: "Israel", abbreviation: "IL" },
  { name: "Italy", abbreviation: "IT" },
  { name: "Jamaica", abbreviation: "JM" },
  { name: "Japan", abbreviation: "JP" },
  { name: "Jersey", abbreviation: "JE" },
  { name: "Jordan", abbreviation: "JO" },
  { name: "Kazakhstan", abbreviation: "KZ" },
  { name: "Kenya", abbreviation: "KE" },
  { name: "Kiribati", abbreviation: "KI" },
  { name: "Kosovo", abbreviation: "XK" },
  { name: "Kuwait", abbreviation: "KW" },
  { name: "Kyrgyzstan", abbreviation: "KG" },
  { name: "Laos", abbreviation: "LA" },
  { name: "Latvia", abbreviation: "LV" },
  { name: "Lebanon", abbreviation: "LB" },
  { name: "Lesotho", abbreviation: "LS" },
  { name: "Liberia", abbreviation: "LR" },
  { name: "Libya", abbreviation: "LY" },
  { name: "Liechtenstein", abbreviation: "LI" },
  { name: "Lithuania", abbreviation: "LT" },
  { name: "Luxembourg", abbreviation: "LU" },
  { name: "Macau SAR China", abbreviation: "MO" },
  { name: "Macedonia", abbreviation: "MK" },
  { name: "Madagascar", abbreviation: "MG" },
  { name: "Malawi", abbreviation: "MW" },
  { name: "Malaysia", abbreviation: "MY" },
  { name: "Maldives", abbreviation: "MV" },
  { name: "Mali", abbreviation: "ML" },
  { name: "Malta", abbreviation: "MT" },
  { name: "Marshall Islands", abbreviation: "MH" },
  { name: "Martinique", abbreviation: "MQ" },
  { name: "Mauritania", abbreviation: "MR" },
  { name: "Mauritius", abbreviation: "MU" },
  { name: "Mayotte", abbreviation: "YT" },
  { name: "Mexico", abbreviation: "MX" },
  { name: "Micronesia", abbreviation: "FM" },
  { name: "Moldova", abbreviation: "MD" },
  { name: "Monaco", abbreviation: "MC" },
  { name: "Mongolia", abbreviation: "MN" },
  { name: "Montenegro", abbreviation: "ME" },
  { name: "Montserrat", abbreviation: "MS" },
  { name: "Morocco", abbreviation: "MA" },
  { name: "Mozambique", abbreviation: "MZ" },
  { name: "Myanmar (Burma)", abbreviation: "MM" },
  { name: "Namibia", abbreviation: "NA" },
  { name: "Nauru", abbreviation: "NR" },
  { name: "Nepal", abbreviation: "NP" },
  { name: "Netherlands", abbreviation: "NL" },
  { name: "New Caledonia", abbreviation: "NC" },
  { name: "New Zealand", abbreviation: "NZ" },
  { name: "Nicaragua", abbreviation: "NI" },
  { name: "Niger", abbreviation: "NE" },
  { name: "Nigeria", abbreviation: "NG" },
  { name: "Niue", abbreviation: "NU" },
  { name: "Norfolk Island", abbreviation: "NF" },
  { name: "North Korea", abbreviation: "KP" },
  { name: "Northern Mariana Islands", abbreviation: "MP" },
  { name: "Norway", abbreviation: "NO" },
  { name: "Oman", abbreviation: "OM" },
  { name: "Pakistan", abbreviation: "PK" },
  { name: "Palau", abbreviation: "PW" },
  { name: "Palestinian Territories", abbreviation: "PS" },
  { name: "Panama", abbreviation: "PA" },
  { name: "Papua New Guinea", abbreviation: "PG" },
  { name: "Paraguay", abbreviation: "PY" },
  { name: "Peru", abbreviation: "PE" },
  { name: "Philippines", abbreviation: "PH" },
  { name: "Pitcairn Islands", abbreviation: "PN" },
  { name: "Poland", abbreviation: "PL" },
  { name: "Portugal", abbreviation: "PT" },
  { name: "Puerto Rico", abbreviation: "PR" },
  { name: "Qatar", abbreviation: "QA" },
  { name: "Réunion", abbreviation: "RE" },
  { name: "Romania", abbreviation: "RO" },
  { name: "Russia", abbreviation: "RU" },
  { name: "Rwanda", abbreviation: "RW" },
  { name: "Samoa", abbreviation: "WS" },
  { name: "San Marino", abbreviation: "SM" },
  { name: "São Tomé and Príncipe", abbreviation: "ST" },
  { name: "Saudi Arabia", abbreviation: "SA" },
  { name: "Senegal", abbreviation: "SN" },
  { name: "Serbia", abbreviation: "RS" },
  { name: "Seychelles", abbreviation: "SC" },
  { name: "Sierra Leone", abbreviation: "SL" },
  { name: "Singapore", abbreviation: "SG" },
  { name: "Sint Maarten", abbreviation: "SX" },
  { name: "Slovakia", abbreviation: "SK" },
  { name: "Slovenia", abbreviation: "SI" },
  { name: "Solomon Islands", abbreviation: "SB" },
  { name: "Somalia", abbreviation: "SO" },
  { name: "South Africa", abbreviation: "ZA" },
  { name: "South Georgia & South Sandwich Islands", abbreviation: "GS" },
  { name: "South Korea", abbreviation: "KR" },
  { name: "South Sudan", abbreviation: "SS" },
  { name: "Spain", abbreviation: "ES" },
  { name: "Sri Lanka", abbreviation: "LK" },
  { name: "St. Barthélemy", abbreviation: "BL" },
  { name: "St. Helena", abbreviation: "SH" },
  { name: "St. Kitts & Nevis", abbreviation: "KN" },
  { name: "St. Lucia", abbreviation: "LC" },
  { name: "St. Martin", abbreviation: "MF" },
  { name: "St. Pierre & Miquelon", abbreviation: "PM" },
  { name: "St. Vincent & Grenadines", abbreviation: "VC" },
  { name: "Sudan", abbreviation: "SD" },
  { name: "Suriname", abbreviation: "SR" },
  { name: "Svalbard & Jan Mayen", abbreviation: "SJ" },
  { name: "Swaziland", abbreviation: "SZ" },
  { name: "Sweden", abbreviation: "SE" },
  { name: "Switzerland", abbreviation: "CH" },
  { name: "Syria", abbreviation: "SY" },
  { name: "Taiwan", abbreviation: "TW" },
  { name: "Tajikistan", abbreviation: "TJ" },
  { name: "Tanzania", abbreviation: "TZ" },
  { name: "Thailand", abbreviation: "TH" },
  { name: "Timor-Leste", abbreviation: "TL" },
  { name: "Togo", abbreviation: "TG" },
  { name: "Tokelau", abbreviation: "TK" },
  { name: "Tonga", abbreviation: "TO" },
  { name: "Trinidad & Tobago", abbreviation: "TT" },
  { name: "Tristan da Cunha", abbreviation: "TA" },
  { name: "Tunisia", abbreviation: "TN" },
  { name: "Turkey", abbreviation: "TR" },
  { name: "Turkmenistan", abbreviation: "TM" },
  { name: "Turks & Caicos Islands", abbreviation: "TC" },
  { name: "Tuvalu", abbreviation: "TV" },
  { name: "U.S. Outlying Islands", abbreviation: "UM" },
  { name: "U.S. Virgin Islands", abbreviation: "VI" },
  { name: "Uganda", abbreviation: "UG" },
  { name: "Ukraine", abbreviation: "UA" },
  { name: "United Arab Emirates", abbreviation: "AE" },
  { name: "United Kingdom", abbreviation: "GB" },
  { name: "United States", abbreviation: "US" },
  { name: "Uruguay", abbreviation: "UY" },
  { name: "Uzbekistan", abbreviation: "UZ" },
  { name: "Vanuatu", abbreviation: "VU" },
  { name: "Vatican City", abbreviation: "VA" },
  { name: "Venezuela", abbreviation: "VE" },
  { name: "Vietnam", abbreviation: "VN" },
  { name: "Wallis & Futuna", abbreviation: "WF" },
  { name: "Western Sahara", abbreviation: "EH" },
  { name: "Yemen", abbreviation: "YE" },
  { name: "Zambia", abbreviation: "ZM" },
  { name: "Zimbabwe", abbreviation: "ZW" },
];

const countriesMap = new Map(countries.map((i) => [i.abbreviation, i.name]));

// By passing a number we get a repeatable source of random generation.
const main = async () => {
  const chance = new Chance(1);

  const generateEventData = (count: number) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const id = nanoid(8);
        const name = `${chance.country({ full: true }) + " " + chance.profession()} Appreciation Day`;

        const slug = `${name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")}-${id}`;
        return {
          id,
          eventDate: new Date(chance.date({ year: 2024 })).toISOString(),
          address: chance.address(),
          coverImage: `https://picsum.photos/seed/${id}/300/300`,
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

  const programmingLanguagesAndFrameWorks = [
    "JavaScript",
    "PHP",
    "Python",
    "C++",
    "Java",
    "C",
    "React",
    "Drizzle",
    "Angular",
    "Vue",
    "Svelte",
  ];

  const generateCommunityData = (count: number) => {
    return Array(count)
      .fill(null)
      .map(() => {
        const country = chance.country();
        const countryFullName = countriesMap.get(country) || "Wakanda";
        const name = `${countryFullName} ${programmingLanguagesAndFrameWorks[chance.integer({ min: 0, max: programmingLanguagesAndFrameWorks.length - 1 })]} Users Group`;
        const slug = `${name
          .toLowerCase()
          .replace(/ /g, "-")
          .replace(/[^\w-]+/g, "")}-${nanoid(8)}`;
        return {
          id: nanoid(8),
          name: name,
          city: chance.city(),
          country: countryFullName,
          coverImage: `https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${country}.svg`,
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
  const communityData = generateCommunityData(30);

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
