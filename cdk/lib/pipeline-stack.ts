import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { AppStage } from "./app-stage";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { GitHubTrigger } from "aws-cdk-lib/aws-codepipeline-actions";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const codeBuildRole = new Role(this, "CodeBuildRole", {
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
      description: "Role for CodeBuild to access SSM parameters",
    });

    codeBuildRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: ["*"],
      }),
    );

    const synthAction = new ShellStep("Synth", {
      input: CodePipelineSource.gitHub("codu-code/codu", "develop", {
        trigger: GitHubTrigger.NONE,
      }),
      commands: ["cd cdk", "npm ci", "npm run build", "npx cdk synth"],
      primaryOutputDirectory: "cdk/cdk.out",
    });

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "codu-pipline",
      crossAccountKeys: true,
      synth: synthAction,
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

    pipeline.addStage(dev, {
      pre: [new cdk.pipelines.ManualApprovalStep("Deploy to develop")],
    });
    pipeline.addStage(prod, {
      pre: [new cdk.pipelines.ManualApprovalStep("Deploy to production")],
    });
  }
}
