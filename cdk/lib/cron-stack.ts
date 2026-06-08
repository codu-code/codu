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

    // RSS Feed Fetcher Lambda
    const rssFetcherFn = new NodejsFunction(this, "RSSFetcherLambda", {
      timeout: cdk.Duration.seconds(300), // 5 minutes for processing multiple feeds
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/rssFetcher/index.ts"),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/rssFetcher/package-lock.json",
      ),
      role: lambdaRole,
      bundling: {
        nodeModules: ["@aws-sdk/client-ssm", "pg", "rss-parser"],
      },
    });

    // Run every 3 hours to fetch new articles
    const rssFetcherRule = new events.Rule(this, "RSSFetcherRule", {
      schedule: events.Schedule.expression("rate(3 hours)"),
    });

    rssFetcherRule.addTarget(new targets.LambdaFunction(rssFetcherFn));

    // Vote Count Reconciliation Lambda
    const voteReconcileFn = new NodejsFunction(this, "VoteReconcileLambda", {
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/voteReconcile/index.ts"),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/voteReconcile/package-lock.json",
      ),
      role: lambdaRole,
      bundling: {
        nodeModules: ["@aws-sdk/client-ssm", "pg"],
      },
    });

    // Run daily at 5:00 AM UTC
    const voteReconcileRule = new events.Rule(this, "VoteReconcileRule", {
      schedule: events.Schedule.expression("cron(0 5 * * ? *)"),
    });

    voteReconcileRule.addTarget(new targets.LambdaFunction(voteReconcileFn));
  }
}
