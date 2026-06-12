# Codú infrastructure (AWS CDK)

Infrastructure for Codú, deployed **directly per account** — there is no CI/CD
pipeline. Each environment lives in its own AWS account (region `eu-west-1`) and
is deployed by assuming that account's credentials and running `cdk deploy`.

## Stacks (per stage)

- **StorageStack** — VPC, RDS (Postgres), the S3 upload bucket, the rate-limit
  DynamoDB table, and the image-resize lambdas.
- **CronStack** — scheduled lambdas (RSS fetcher, vote-count reconciliation,
  scheduled-post promotion). The promotion lambda reads two **manually created
  SSM parameters per account** and fails closed when they're missing:
  - `/env/siteUrl` — the app origin to POST (e.g. `https://www.codu.co`)
  - `/env/cronSecret` — must exactly equal the `CRON_SECRET` env var set in
    Vercel for the same environment (the app's `/api/cron/*` routes verify it)
- **IamStack** — the IAM user the Vercel app authenticates as, granted exactly
  what the app uses (S3 read/write, `dynamodb:UpdateItem`, `ses:SendEmail`). Its
  outputs are the app access keys to set in Vercel. **Add any new app AWS grant
  here**, next to the resource it touches.

## Deploying

`DEPLOY_STAGE` selects the stage (stack names + the production flag); the account
and region come from the active credentials.

```sh
npm ci && npm run build

# with the Dev account's credentials active:
DEPLOY_STAGE=Dev  npx cdk diff   "CoduPipeline/Dev/StorageStack"
DEPLOY_STAGE=Dev  npx cdk deploy "CoduPipeline/Dev/StorageStack" "CoduPipeline/Dev/IamStack"

# with the Prod account's credentials active:
DEPLOY_STAGE=Prod npx cdk deploy "CoduPipeline/Prod/StorageStack" "CoduPipeline/Prod/IamStack"
```

> The `CoduPipeline` path prefix is a legacy construct-path anchor (kept so
> existing stacks stay diff-clean), **not** a pipeline. See `bin/cdk-codu.ts`.
