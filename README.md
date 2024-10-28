# [Codú](https://www.codu.co)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/codu-code/codu/pulls)

![Codu Logo](https://raw.githubusercontent.com/codu-code/codu/develop/public/images/codu-gradient.png)

> A space for coders

Codú is the ultimate community of web developers to learn, share, and get support for your projects, either big or small. It is the perfect place to sharpen your skills and build your portfolio. In Codú, we're all here to help each other to grow as web developers. Plus, Codú makes it easier to find collaborators for your next big project.

---

## 💬 Join the conversation

We have a fantastic community growing on Discord. Click [here](https://discord.gg/NxSkYtZ) to join!

---

## 🖥️ Installation

1. Fork the project
2. Clone with `git clone https://github.com/YOUR_USERNAME/codu.git`.
3. Navigate to the project directory `cd codu`.
4. Install dependencies with:

```bash
npm install
```

- If you have any issues installing dependencies, check your node version against that defined in the `.nvmrc`. If you're using `nvm`, you can run `nvm use` before installing dependencies.

5. Create a `.env` file and add the following variables. You can copy the contents of `sample.env` with `cat sample.env > .env`.

```
# This default value is if you run our local docker-compose.yml file to create the database.
DATABASE_URL=postgresql://postgres:secret@127.0.0.1:5432/postgres
# Setup your GitHub ID & Secret on GitHub: https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps
# For development, make sure you set up this with a Homepage URL of http://localhost:3000/ and an Authorization callback URL of http://localhost:3000/api/auth
GITHUB_ID=YOUR_GITHUB_APP_ID
GITHUB_SECRET=YOUR_GITHUB_APP_SECRET
NEXTAUTH_URL=http://localhost:3000/api/auth
```

For a more detailed how to guide on setting them up [go to the Environment Variables section](#environment-variables).

**NOTE:** Before proceeding, [make sure your database is running](#database_url).

6.  Setup the tables in the database with Drizzle by running:

```bash
npm run db:migrate
```

The full command can be seen in our [package.json](/package.json#16) file

7. Seed the database with some mock data by running:

```bash
npm run db:seed
```

The full command can be seen in our [package.json](/package.json#19) file

8. Finally, run the development server:

```bash
npm run dev
```

After completion of above commands, now -

Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the result.

You can start your journey by modifying `pages/index.tsx`. With Auto-update feature, pages updates as you edit the file.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

Learn more about API routes [here](https://nextjs.org/docs/api-routes/introduction).

## Environment Variables

### DATABASE_URL

The `DATABASE_URL` is a connection string to a PostgreSQL database (version 15.0).

By default, we point to a database running locally with Docker from our `docker-compose.yml` file.

To run this file, make sure you have [Docker installed](https://docs.docker.com/get-docker/) and that Docker is running.

Run the command `docker compose up`.

Alternatively, if you have PostgreSQL running locally then you can use your local connection string or grab one from a free service like [Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#finding-your-connection-string).

### GITHUB_ID and GITHUB_SECRET

Currently, we only allow authentication via GitHub. To enable this you need to have a `GITHUB_ID` and `GITHUB_SECRET` value.

Setup your GitHub ID & Secret on GitHub:

- [Click here](https://github.com/settings/applications/new) to setup New OAuth App and fill in the details as shown below.

For development, make sure you setup this with a **Homepage URL** of

```
http://localhost:3000/
```

and **Authorization callback URL** of

```
http://localhost:3000/api/auth
```

as shown in the image below:

![Screenshot 2022-10-25 at 08 22 03](https://user-images.githubusercontent.com/12615742/197709325-50766dc2-2245-438c-8f71-09064fc3b123.png)

After you click the "Register application" button you should see the `GITHUB_ID` and be able to generate a new client secret. You can see this in the screenshot below. 👇
![Screenshot 2022-10-25 at 08 23 22](https://user-images.githubusercontent.com/12615742/197710695-d3ef9cb7-fe66-4a53-8b3e-d66064434068.png)
After generating the secret, make sure you copy this value to your `.env` file as this value can not be seen again once you refresh the page. 👇
![Screenshot 2022-10-25 at 08 26 04](https://user-images.githubusercontent.com/12615742/197710697-ef791d9e-b205-4667-a97c-477148917897.png)

More info on Authorizing OAuth in the GitHub documentation
[here](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps).

### Setting up Passwordless auth locally

In order to use Passwordless login locally you need to have a `ACCESS_KEY` and `SECRET_KEY` value.

Niall has written a [tutorial](https://www.codu.co/articles/sending-emails-with-aws-ses-and-nodemailer-in-node-js-xfuucrri) on how to send emails with AWS SES and shows how to get these values.

Check out the example .env file [here](./sample.env) to see how to populate these values

**Note: Currenly the AWS region of the SNS service is hardcoded to "eu-west-1" it may be necessary to change this if your SNS service is in a different region**

### NEXTAUTH_URL

You shouldn't need to change the default value here. This is a variable used by Next Auth as the authentication URL to your site.

```
NEXTAUTH_URL=http://localhost:3000/api/auth
```

### E2E_USER_ONE_SESSION_ID

This is the sessionToken uuid that is used to identify a users current active session.
This is currently hardcoded and their is no reason to change this value.
**Note: This value must be different to E2E_USER_TWO_SESSION_ID**


### E2E_USER_TWO_SESSION_ID

This is the sessionToken uuid that is used to identify a users current active session.
This is currently hardcoded and their is no reason to change this value.
**Note: This value must be different to E2E_USER_ONE_SESSION_ID**


### E2E_USER_ONE_ID

This is the userId of one of our E2E users and is used for testing.
This is currently hardcoded and there is no reason to change this value.
**Note: This value must be different from E2E_USER_TWO_ID**


### E2E_USER_TWO_ID

This is the userId of one of our E2E users and is used for testing.
This is currently hardcoded and there is no reason to change this value.
**Note: This value must be different from E2E_USER_ONE_ID**

For more information, you can read the documentation [here](https://next-auth.js.org/configuration/options).
**Example .env file can be found [here](./sample.env). You can rename this to .env to get started**

## 👨‍💻 Contribution Guidelines

- Contributions are **greatly appreciated**. Contributions make the open-source community an amazing place to learn, inspire, and create.
- Check out our [contribution guidelines](/CONTRIBUTING.md) for contributiong to our repo. It includes
  - How to Contribute
  - How to create a Pull Request
  - Run Tests
  - Also, Style Guide for Commit Messages

## End-to-End Testing with Playwright

To run the end-to-end tests using Playwright, you need to configure your environment and follow these steps:

### Environment Variables

Please ensure you have the following variables set in your `.env` file:

- `E2E_USER_ID`: The id of the E2E user for testing.
- `E2E_USER_EMAIL`: The email of the E2E user for testing.
- `E2E_USER_ONE_SESSION_ID`: The session id that the user will use to authenticate.


Note the sample .env [here](./sample.env) is fine to use.

### Session and User setup

First you need to add your E2E test user to your locally running database. Do this by running the following script if you havent already

```
npm run db:seed
```

This will create a user and session for your E2E tests. Details of the E2E user created can be seen [here](./drizzle/seedE2E.ts)

### Running the Tests

You can run the end-to-end tests using one of the following commands:

For headless mode:

```zsh
npx playwright test
```

For UI mode:

```zsh
npx playwright test --ui
```

## 📙 Prerequisite Skills to Contribute

- [Git](https://git-scm.com/)

### 📃 Documentation Contributions

- [Markdown](https://www.markdownguide.org/basic-syntax/)

### 💾 Code Contributions

- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Tailwind](https://tailwindcss.com/)
- [Drizzle](https://orm.drizzle.team/)

## 📚 Additional Resources

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

### Editor Doc

To learn about the editor shortcuts and hotkeys you can check out this document

- [Markdoc Editor Hotkeys and Shortcus](/EDITOR_SHORTCUTS.MD)

## 💥 Issues

You are welcome to [open issues](https://github.com/codu-code/codu/issues/new/choose) to discuss ideas about improving our Codú. Enhancements are encouraged and appreciated.
