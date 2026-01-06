import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Client } from "pg";
import { algoliasearch } from "algoliasearch";
const ssmClient = new SSMClient({ region: "eu-west-1" });

const [ARTICLE, PAGE, USER] = ["Article", "Page", "User"];

// Helper to get values from AWS SSM
async function getSsmValue(secretName: string) {
  const params = {
    Name: secretName,
    WithDecryption: true, // Required for secureString
  };

  try {
    const command = new GetParameterCommand(params);
    const response = await ssmClient.send(command);
    if (!response.Parameter || !response.Parameter.Value) {
      throw new Error(`Parameter not found: ${secretName}`);
    }
    return response.Parameter.Value;
  } catch (error) {
    console.error(`Error retrieving secret: ${error}`);
    throw error;
  }
}

exports.handler = async function () {
  console.log("Lambda running");

  try {
    const [
      BASE_URL,
      ALGOLIA_APP_ID,
      ALGOLIA_ADMIN_KEY,
      ALGOLIA_SOURCE_IDX,
      DATABASE_URL,
    ] = await Promise.all([
      getSsmValue("/env/baseUrl"),
      getSsmValue("/env/algoliaAppId"),
      getSsmValue("/env/algoliaAdminKey"),
      getSsmValue("/env/algoliaIdx"),
      getSsmValue("/env/db/dbUrl"),
    ]);

    const client = new Client({
      connectionString: DATABASE_URL,
    });

    await client.connect();

    const { rows: posts } = await client.query(
      `SELECT p.title, p.excerpt, p.slug, u.username
       FROM "Post" p
       INNER JOIN "user" u ON p."userId" = u.id
       WHERE p."published" < NOW() AND p."approved" = true;`,
    );

    const { rows: users } = await client.query(
      `SELECT username, name, image, bio FROM "user";`,
    );

    const postIdx = posts.map(({ title, excerpt, slug, username }) => ({
      category: ARTICLE,
      title,
      description: excerpt,
      url: `${BASE_URL}/${username}/${slug}`,
      image: null,
    }));

    const userIdx = users.map(({ username, name, image, bio }) => ({
      category: USER,
      title: `${name} (@${username})`,
      description: bio,
      url: `${BASE_URL}/${username}`,
      image,
    }));

    const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

    const PAGES = [
      {
        title: "Articles Feed",
        description: "Read the articles posted on Codú",
        url: `${BASE_URL}/articles`,
        category: PAGE,
        image: null,
      },
      {
        title: "Sponsorship",
        description: "Looking to sponsor Codú? Learn more here!",
        url: `${BASE_URL}/sponsorship`,
        category: PAGE,
        image: null,
      },
      {
        title: "Code of Conduct",
        description: "Codú's Code of Conduct",
        url: "/code-of-conduct",
        category: PAGE,
        image: null,
      },
    ];

    // v5 API: methods called directly on client with indexName parameter
    await algoliaClient.clearObjects({ indexName: ALGOLIA_SOURCE_IDX });
    await algoliaClient.saveObjects({
      indexName: ALGOLIA_SOURCE_IDX,
      objects: [...postIdx, ...userIdx, ...PAGES],
    });

    console.log("Algolia index updated");

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/json" },
      body: {
        message: "success",
        data: JSON.stringify([...postIdx, ...userIdx, ...PAGES]),
      },
    };

    // Use the variables here
  } catch (error) {
    console.error("Error fetching parameter:", error);
    // Handle the error accordingly
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/json" },
      body: {
        message: "error",
        data: JSON.stringify(error),
      },
    };
  }
};
