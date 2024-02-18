import * as cdk from "aws-cdk-lib";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import * as path from "path";

export class CronStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Define the IAM role for the Lambda function
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Grant read access to SSM parameters
    const policy = new iam.PolicyStatement({
      actions: [
        "ssm:GetParameter*",
        "ssm:DescribeParameters",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ],
      resources: ["*"],
    });

    lambdaRole.addToPolicy(policy);

    const lambdaFn = new NodejsFunction(this, "AlgoliaLambda", {
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/algoliaIndex/index.ts"),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/algoliaIndex/package-lock.json",
      ),
      role: lambdaRole,
      bundling: {
        nodeModules: ["@aws-sdk/client-ssm", "algoliasearch", "pg"],
      },
    });

    // 6:00 (am) every day
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0 6 * * ? *)"),
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
  }
}
