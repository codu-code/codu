import postgres from "postgres";
import { E2E_USER_ONE_ID, E2E_USER_TWO_ID } from "./constants";

export const teardown = async () => {
  try {
    const db = postgres("postgresql://postgres:secret@127.0.0.1:5432/postgres");

    // the test suit adds posts created by the E2E users. We want to remove them between test runs
    await db`
    DELETE FROM "Post" WHERE "userId" = ${E2E_USER_ONE_ID}
  `;
    await db`
    DELETE FROM "Post" WHERE "userId" = ${E2E_USER_TWO_ID}
  `;
    // the test suit adds comments created by the E2E user. We want to remove them between test runs
    await db`
    DELETE FROM "Comment" WHERE "userId" = ${E2E_USER_ONE_ID}
  `;
    await db`
    DELETE FROM "Comment" WHERE "userId" = ${E2E_USER_TWO_ID}
  `;

    console.log("DB clean up successful");
  } catch (err) {
    console.log("Error while cleaning up DB after E2E test run", err);
  }
};

export default teardown;
