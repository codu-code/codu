import * as cdk from "aws-cdk-lib";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as path from "path";

export class CronStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lambdaFn = new NodejsFunction(this, "Singleton", {
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "/../lambdas/testCron.js"),
    });

    // Every 5 minutes between 8:00 AM (UTC+0) and 5:55 PM (UTC+0) weekdays
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0/5 8-17 ? * MON-FRI *)"),
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
  }
}
