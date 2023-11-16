import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AppStage } from "./app-stage";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const synthAction = new ShellStep("Synth", {
      input: CodePipelineSource.gitHub("codu-code/codu", "develop"),
      commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
      primaryOutputDirectory: "cdk/cdk.out",
      env: {
        DATABASE_URL: secretsmanager.Secret.fromSecretNameV2(
          this,
          "DB_SECRET",
          "prod/db/url",
        ).secretValue.toString(),
      },
    });

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "codu-pipline",
      crossAccountKeys: true,
      synth: synthAction,
      dockerEnabledForSelfMutation: true,
      dockerEnabledForSynth: true,
    });

    const devAccountId = ssm.StringParameter.valueFromLookup(
      this,
      `/env/dev/accountId`
    );

    const prodAccountId = ssm.StringParameter.valueFromLookup(
      this,
      `/env/prod/accountId`
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
