import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppStage } from "./app-stage";
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
      commands: ["npm ci", "npm run build", "npx cdk synth"],
    });

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "codu-pipline",
      crossAccountKeys: true,
      synth: synthAction,
    });

    const getConfig = (env: "dev" | "prod") => {
      const accountId = ssm.StringParameter.valueFromLookup(
        this,
        `/env/${env}/accountId`
      );

      const domainName = ssm.StringParameter.valueFromLookup(
        this,
        `/env/${env}/domainName`
      );

      const hostedZoneId = ssm.StringParameter.valueFromLookup(
        this,
        `/env/${env}/hostedZoneId`
      );

      return {
        env: {
          // Because on first synth we have a dummy value that doesn't allow the synth to resolve
          account: accountId.includes("dummy-value") ? "123456789" : accountId,
          region: "eu-west-1",
        },
        domainName: domainName,
        hostedZoneId: hostedZoneId,
      };
    };

    const dev = new AppStage(this, "Dev", getConfig("dev"));

    pipeline.addStage(
      dev
      // {
      //   pre: [new cdk.pipelines.ManualApprovalStep("Deploy to dev")],
      // }
    );
  }
}
