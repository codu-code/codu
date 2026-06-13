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

    // Bedrock — auto-review calls Claude Haiku 4.5 via the Bedrock Runtime.
    //
    // Haiku 4.5 is invoked through a CROSS-REGION INFERENCE PROFILE (the EU
    // `eu.anthropic.claude-haiku-4-5-*` / US `us.anthropic.claude-haiku-4-5-*`
    // profile), not the bare foundation-model id. When you InvokeModel against
    // an inference profile, IAM authorizes against BOTH:
    //   1. the inference-profile ARN, AND
    //   2. the underlying foundation-model ARN in EVERY region the profile may
    //      route the request to.
    // So a grant that names only one of them — or only the stack's own region —
    // will intermittently fail with AccessDenied as the profile fans out.
    //
    // We deliberately keep this slightly broad to avoid blocking invocation:
    //  - foundation-model: region wildcard (foundation-model ARNs are
    //    region-scoped but account-less, hence the empty `::`) so it covers
    //    eu-west-1 (our default BEDROCK_REGION) and any sibling region the
    //    EU/US profile routes to.
    //  - inference-profile: scoped to this account, any region/profile id.
    // TIGHTEN LATER: once the exact profile id + region set is locked, replace
    // the wildcards with the specific `eu.`/`us.` profile ARN(s) and the precise
    // region list (e.g. eu-west-1/eu-west-3/eu-central-1/eu-north-1).
    appUser.addToPolicy(
      new iam.PolicyStatement({
        sid: "AppBedrockInvoke",
        actions: ["bedrock:InvokeModel"],
        resources: [
          // Underlying foundation model, in any region the profile routes to.
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
          // The cross-region inference profile in this account.
          `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
        ],
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
