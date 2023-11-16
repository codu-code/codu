import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AppStage } from "./app-stage";
import { BuildEnvironmentVariableType } from "aws-cdk-lib/aws-codebuild";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import * as ssm from "aws-cdk-lib/aws-ssm";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const synthAction = new ShellStep("Synth", {
      input: CodePipelineSource.gitHub("codu-code/codu", "develop"),
      commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
      primaryOutputDirectory: "cdk/cdk.out",
    });

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "codu-pipline",
      crossAccountKeys: true,
      synth: synthAction,
      dockerEnabledForSelfMutation: true,
      dockerEnabledForSynth: true,
      codeBuildDefaults: {
        buildEnvironment: {
          environmentVariables: {
            DATABASE_URL: {
              type: BuildEnvironmentVariableType.SECRETS_MANAGER,
              value: Secret.fromSecretNameV2(this, "DB_SECRET", "prod/db/url"),
            },
          },
        },
      },
    });

    const devAccountId = ssm.StringParameter.valueFromLookup(
      this,
      `/env/dev/accountId`,
    );

    const prodAccountId = ssm.StringParameter.valueFromLookup(
      this,
      `/env/prod/accountId`,
    );

    const defaultRegion = "eu-west-1";

    const dev = new AppStage(this, "Dev", {
      env: {
        account: devAccountId,
        region: defaultRegion,
      },
    });

    const prod = new AppStage(this, "Prod", {
      env: {
        account: prodAccountId,
        region: defaultRegion,
      },
      production: true,
    });

    pipeline.addStage(dev);
    pipeline.addStage(prod, {
      pre: [new cdk.pipelines.ManualApprovalStep("Deploy to production")],
    });
  }
}
