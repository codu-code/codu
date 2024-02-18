import * as cdk from "aws-cdk-lib";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as path from "path";

export class CronStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lambdaFn = new NodejsFunction(this, "AlgoliaLambda", {
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/algoliaIndex/index.ts"),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/algoliaIndex/package-lock.json",
      ),
      bundling: {
        nodeModules: ["@aws-sdk/client-ssm"],
      },
    });

    const algoliaIdx = ssm.StringParameter.fromStringParameterName(
      this,
      "AlgoliaIdx",
      "/env/algoliaIdx",
    );
    algoliaIdx.grantRead(lambdaFn);
    // 8:00 AM (UTC+0) on the first day of the month
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0 8 1 * ? *)"),
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
  }
}
