#!/usr/bin/env node
// TEMPORARY out-of-band entrypoint: deploys a single AppStage's StorageStack
// directly to whatever account the active AWS credentials point at, bypassing
// the CodePipeline, to land the RateLimitTable ahead of merging this branch to
// `develop`.
//
// Account/region are taken from the active credentials (CDK_DEFAULT_ACCOUNT /
// CDK_DEFAULT_REGION, which the CDK CLI fills in from STS) — nothing hardcoded.
// The target stage is chosen with DEPLOY_STAGE (Dev|Prod), which controls both
// the stack name (Dev-StorageStack / Prod-StorageStack) and the production flag
// (RETAIN policies, backup vault, larger RDS) so the synth matches the
// pipeline-managed stack byte-for-byte.
//
//   DEPLOY_STAGE=Dev  cdk --app "..." diff   CoduPipeline/Dev/StorageStack
//   DEPLOY_STAGE=Prod cdk --app "..." deploy CoduPipeline/Prod/StorageStack
//
// The "CoduPipeline" parent stack only anchors the construct path so
// auto-generated tags/logical IDs match the pipeline. It is never deployed.
// Safe to delete this file after the change is merged and the pipeline runs.
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppStage } from "../lib/app-stage";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "eu-west-1",
};

const stageId = process.env.DEPLOY_STAGE === "Prod" ? "Prod" : "Dev";

const pipelineScope = new cdk.Stack(app, "CoduPipeline", { env });

new AppStage(pipelineScope, stageId, {
  env,
  production: stageId === "Prod",
});
