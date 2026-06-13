#!/usr/bin/env node
// Canonical CDK entrypoint — direct deploy, no CodePipeline.
//
// We deploy each account's stage directly with that account's credentials
// (two-step: assume Dev creds → deploy Dev, assume Prod creds → deploy Prod).
// The self-mutating CodePipeline was removed to drop its standing cost; infra
// changes here are rare enough that the manual two-step is fine.
//
//   # with Dev account credentials active:
//   DEPLOY_STAGE=Dev  npx cdk diff   "CoduPipeline/Dev/StorageStack"
//   DEPLOY_STAGE=Dev  npx cdk deploy "CoduPipeline/Dev/StorageStack" "CoduPipeline/Dev/IamStack"
//   # with Prod account credentials active:
//   DEPLOY_STAGE=Prod npx cdk deploy "CoduPipeline/Prod/StorageStack" "CoduPipeline/Prod/IamStack"
//
// Account/region come from the active credentials (CDK_DEFAULT_ACCOUNT /
// CDK_DEFAULT_REGION, filled in by the CDK CLI via STS). DEPLOY_STAGE (Dev|Prod)
// selects the stack names (Dev-* / Prod-*) and the production flag (RETAIN
// policies, backup vault, larger RDS).
//
// NOTE on the "CoduPipeline" scope id: it's a legacy path anchor, NOT a pipeline.
// The live stacks were first created by the old pipeline under the construct
// path `CoduPipeline/<Stage>/<Stack>`, and CDK bakes that path into some
// auto-generated logical IDs and Name tags. Keeping the id preserves those so
// deploys stay diff-clean. It synthesizes an empty stack that is never deployed
// (always target the specific stage stacks above). Renaming it would cause a
// one-time, low-risk churn (VPC Name tags + S3-notification Lambda permissions)
// — not worth it for a cosmetic rename.
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStage } from "../lib/app-stage";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "eu-west-1",
};

const stageId = process.env.DEPLOY_STAGE === "Prod" ? "Prod" : "Dev";

const pathAnchor = new cdk.Stack(app, "CoduPipeline", { env });

new AppStage(pathAnchor, stageId, {
  env,
  production: stageId === "Prod",
});
