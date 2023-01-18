#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

new PipelineStack(app, "CoduPipeline", {
  env: {
    region: "eu-west-1",
    account: "764918915129",
  },
  crossRegionReferences: true,
});
