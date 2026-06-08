import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";

interface Props extends cdk.StackProps {
  /** Upload bucket the app reads/writes (avatars, images, presigned uploads). */
  bucket: s3.IBucket;
  /** Rate-limit counter table the app increments per request. */
  rateLimitTable: dynamodb.ITable;
}

/**
 * Owns the IAM principal the Vercel-hosted app authenticates as. Because the app
 * runs outside AWS it uses long-lived access keys (not an assumed role), so this
 * stack creates the user, grants exactly what the app touches, and emits an
 * access key pair as stack outputs.
 *
 * Keeping this in the stack means any new AWS resource the app needs gets its
 * grant wired here, next to the user — no out-of-band IAM editing.
 *
 * NOTE: the secret access key is surfaced as a CloudFormation output so it can
 * be copied into Vercel once. Treat it as sensitive (it's readable by anyone who
 * can DescribeStacks) and rotate via `iam create-access-key` if it leaks.
 */
export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const appUser = new iam.User(this, "AppUser");

    // S3 — read/write the upload bucket (presigned PUTs + reads).
    props.bucket.grantReadWrite(appUser);

    // DynamoDB — fixed-window rate-limit counters (atomic UpdateItem only).
    props.rateLimitTable.grant(appUser, "dynamodb:UpdateItem");

    // SES — transactional email (magic-link sign-in, moderation, reports).
    // Identity/config-set ARNs vary by env, so scope to the send actions.
    appUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "AppSesSend",
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      }),
    );

    const accessKey = new iam.CfnAccessKey(this, "AppUserAccessKey", {
      userName: appUser.userName,
    });

    new cdk.CfnOutput(this, "AppUserName", { value: appUser.userName });
    new cdk.CfnOutput(this, "AppAccessKeyId", { value: accessKey.ref });
    new cdk.CfnOutput(this, "AppSecretAccessKey", {
      value: accessKey.attrSecretAccessKey,
    });
  }
}
