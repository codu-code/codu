import { type SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";

export default {
  config() {
    return {
      name: "codu",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const domainName = app.stage === "dev" ? "dev1.codu.co" : "codu.co";
      const bucketName = app.stage === "dev" ? "dev.codu" : "codu.uploads";
      const wwwDomainName = `www.${domainName}`;

      const {
        ALGOLIA_ADMIN_KEY,
        DATABASE_URL,
        NEXT_PUBLIC_FATHOM_SITE_ID,
        NEXT_PUBLIC_SENTRY_DSN,
      } = process.env;
      if (
        !ALGOLIA_ADMIN_KEY ||
        !DATABASE_URL ||
        !NEXT_PUBLIC_FATHOM_SITE_ID ||
        !NEXT_PUBLIC_SENTRY_DSN
      ) {
        throw new Error(
          `ALGOLIA_ADMIN_KEY, DATABASE_URL, NEXT_PUBLIC_FATHOM_SITE_ID and NEXT_PUBLIC_SENTRY_DSN are required`,
        );
      }
      const site = new NextjsSite(stack, "site", {
        // @TODO: Fix Prisma bundle issue
        // edge: true,
        experimental: {
          streaming: true,
        },
        permissions: ["ses", "s3"],
        customDomain: {
          domainName: wwwDomainName,
          domainAlias: domainName,
          hostedZone: domainName,
        },
        environment: {
          S3_BUCKET_NAME: bucketName,
          DATABASE_URL,
          BASE_URL: `https://${wwwDomainName}`,
          DOMAIN_NAME: wwwDomainName,
          NEXTAUTH_URL: `https://${wwwDomainName}`,
          NEXT_PUBLIC_FATHOM_SITE_ID: NEXT_PUBLIC_FATHOM_SITE_ID,
          NEXT_PUBLIC_SENTRY_DSN: NEXT_PUBLIC_SENTRY_DSN,
          SENTRY_ENVIRONMENT: ssm.StringParameter.valueFromLookup(
            this,
            "/env/sentry/environment",
          ),
          SENTRY_DSN: ssm.StringParameter.valueFromLookup(
            this,
            "/env/sentry/dsn",
          ),
          GITHUB_SECRET: ssm.StringParameter.valueFromLookup(
            this,
            "/env/githubSecret",
          ),
          GITHUB_ID: ssm.StringParameter.valueFromLookup(this, "/env/githubId"),
          NEXTAUTH_SECRET: ssm.StringParameter.valueFromLookup(
            this,
            "/env/nextauthSecret",
          ),
          DISCORD_INVITE_URL: ssm.StringParameter.valueFromLookup(
            this,
            "/env/discordInviteUrl",
          ),
          ADMIN_EMAIL: ssm.StringParameter.valueFromLookup(
            this,
            "/env/adminEmail",
          ),
          ALGOLIA_APP_ID: ssm.StringParameter.valueFromLookup(
            this,
            "/env/algoliaAppId",
          ),
          ALGOLIA_SEARCH_API: ssm.StringParameter.valueFromLookup(
            this,
            "/env/algoliaSearchApi",
          ),
          ALGOLIA_SOURCE_IDX: ssm.StringParameter.valueFromLookup(
            this,
            "/env/algoliaIdx",
          ),
          EMAIL_API_KEY: ssm.StringParameter.valueFromLookup(
            this,
            "/env/email/key",
          ),
          EMAIL_API_ENDPOINT: ssm.StringParameter.valueFromLookup(
            this,
            "/env/email/endpoint",
          ),
          EMAIL_NEWSLETTER_ID: ssm.StringParameter.valueFromLookup(
            this,
            "/env/email/id",
          ),
        },
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
