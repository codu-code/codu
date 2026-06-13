# [Codú](https://www.codu.co)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/codu-code/codu/pulls)

![Codu Logo](https://raw.githubusercontent.com/codu-code/codu/develop/public/images/codu-gradient.png)

> A community for AI builders and indie hackers

Codú is a community for AI builders and indie hackers. Share what you're building, learn from people shipping real projects, and get support — whether it's a weekend experiment or a product you're taking to market. Write articles, post TILs, start discussions, ask questions, and find people to build with.

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

For a more detailed guide on setting them up [go to the Environment Variables section](#environment-variables).

**NOTE:** Before proceeding, [make sure your database is running](#database_url).

6. Setup the tables in the database with Drizzle by running:

```bash
npm run db:migrate
```

The full command can be seen in our [package.json](/package.json#16) file.

> Deploy note: Vercel runs `db:migrate` automatically only on **production**
> builds (`vercel-build`). Preview deploys do NOT migrate — when a branch adds
> migrations, run `npm run db:migrate` against the shared dev database before
> (or right after) opening the preview, or its new queries will hit an
> unmigrated schema.

7. Seed the database with some mock data by running:

```bash
npm run db:seed
```

The full command can be seen in our [package.json](/package.json#19) file.

8. Finally, run the development server:

```bash
npm run dev
```

After completion of the above commands, navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the result.

The app uses the Next.js App Router — routes live in the `app/` directory and hot-reload as you edit. The home feed is served from `app/(app)/page.tsx`.

API endpoints are [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) under `app/api/*`, alongside the tRPC routers in `server/`.

## Environment Variables

### DATABASE_URL

The `DATABASE_URL` is a connection string to a PostgreSQL database (version 15).

By default, we point to a database running locally with Docker from our `docker-compose.yml` file.

To run this file, make sure you have [Docker installed](https://docs.docker.com/get-docker/) and that Docker is running.

Run the command `docker compose up`.

Alternatively, if you have PostgreSQL running locally, you can use your local connection string or grab one from a free service like [Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#finding-your-connection-string).

### Local email (Mailpit)

`docker compose up` also starts [Mailpit](https://mailpit.axllent.org/), a local email catcher. Set `EMAIL_PROVIDER=local` in your `.env` and every outgoing email (magic-link sign-in, moderation/report notifications) is captured at [http://localhost:8027](http://localhost:8027) instead of being sent through SES — no AWS credentials or real inboxes needed in development.

The email E2E spec (`e2e/email.spec.ts`) asserts delivery through Mailpit's API; it skips automatically when Mailpit isn't running. To include it: `EMAIL_PROVIDER=local npm run dev:e2e` (server) and `EMAIL_PROVIDER=local npm test` (tests).

### GITHUB_ID and GITHUB_SECRET

Currently, we only allow authentication via GitHub. To enable this, you need to have a `GITHUB_ID` and `GITHUB_SECRET` value.

Set up your GitHub ID & Secret on GitHub:

- [Click here](https://github.com/settings/applications/new) to set up a New OAuth App and fill in the details as shown below.

For development, make sure you set this up with a **Homepage URL** of

```
http://localhost:3000/
```

and an **Authorization callback URL** of

```
http://localhost:3000/api/auth
```

After you click the "Register application" button, you should see the `GITHUB_ID` and be able to generate a new client secret. After generating the secret, make sure you copy this value to your `.env` file as this value cannot be seen again once you refresh the page.

More info on Authorizing OAuth in the GitHub documentation [here](https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps).

### Setting up Passwordless Auth Locally

In order to use Passwordless login locally, you need to have an `ACCESS_KEY` and `SECRET_KEY` value.

Check out the example `.env` file [here](./sample.env) to see how to populate these values.

**Note:** Currently, the AWS region of the SNS service is hardcoded to "eu-west-1"; it may be necessary to change this if your SNS service is in a different region.

### NEXTAUTH_URL

You shouldn't need to change the default value here. This is a variable used by Next Auth as the authentication URL to your site.

```
NEXTAUTH_URL=http://localhost:3000/api/auth
```

**Example .env file can be found [here](./sample.env). You can rename this to `.env` to get started.**

## 👨‍💻 Contribution Guidelines

- Contributions are **greatly appreciated**. Contributions make the open-source community an amazing place to learn, inspire, and create.
- Check out our [contribution guidelines](/CONTRIBUTING.md) for contributing to our repo. It includes
  - How to Contribute
  - How to create a Pull Request
  - Run Tests
  - Style Guide for Commit Messages

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

To learn about the editor shortcuts and hotkeys, you can check out this document:

- [Markdoc Editor Hotkeys and Shortcuts](/EDITOR_SHORTCUTS.MD)

## 🧪 E2E Testing

For information on E2E testing, please refer to our dedicated documentation [here](./E2E%20Overview.md).

## 💥 Issues

You are welcome to [open issues](https://github.com/codu-code/codu/issues/new/choose) to discuss ideas about improving Codú. Enhancements are encouraged and appreciated.
