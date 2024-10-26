import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config(); // Load .env file contents into process.env

export const teardown = async () => {
  try {
    if (
      !process.env.DATABASE_URL ||
      !process.env.E2E_USER_ONE_ID ||
      !process.env.E2E_USER_TWO_ID
    )
      throw new Error("Missing env variables for DB clean up script");
    const db = postgres(process.env.DATABASE_URL as string);

    // the test suit adds posts created by the E2E users. We want to remove them between test runs
    await db`
    DELETE FROM "Post" WHERE "userId" = ${process.env.E2E_USER_ONE_ID as string}
  `;
    await db`
    DELETE FROM "Post" WHERE "userId" = ${process.env.E2E_USER_TWO_ID as string}
  `;
    // the test suit adds comments created by the E2E user. We want to remove them between test runs
    await db`
    DELETE FROM "Comment" WHERE "userId" = ${process.env.E2E_USER_ONE_ID as string}
  `;
    await db`
    DELETE FROM "Comment" WHERE "userId" = ${process.env.E2E_USER_TWO_ID as string}
  `;

    console.log("DB clean up successful");
  } catch (err) {
    console.log("Error while cleaning up DB after E2E test run", err);
  }
};

export default teardown;
