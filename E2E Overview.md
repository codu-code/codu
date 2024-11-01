# End-to-End Testing with Playwright

To run the end-to-end tests using Playwright, you need to configure your environment and follow these steps:

### Session and User Setup

First, you need to add your E2E test user to your locally running database. Do this by running the following script if you haven't already:

```bash
npm run db:seed
```

This will create a user and session for your E2E tests. Details of the E2E user created can be seen in `drizzle/seedE2E.ts`.

### Running the Tests

You can run the end-to-end tests using one of the following commands:

For headless mode:

```bash
npx playwright test
```

For UI mode:

```bash
npx playwright test --ui
```

### Additional E2E constants

- **E2E_USER_ONE_SESSION_ID**: This is the session token UUID for one E2E user.
- **E2E_USER_TWO_SESSION_ID**: This is the session token UUID for another E2E user.
- **E2E_USER_ONE_ID**: The user ID of one of the E2E users.
- **E2E_USER_TWO_ID**: The user ID of another E2E user.
