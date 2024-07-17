import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { CdnStack } from "./cdn-stack";
import { CronStack } from "./cron-stack";

interface Props extends cdk.StageProps {
  production?: boolean;
}

class SharedResourcesStack extends cdk.Stack {
  public readonly cloudFrontOAI: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "CloudFrontOAI",
      {
        comment: "OAI for S3 bucket access",
      },
    );
  }
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { production } = props;

    const sharedResourcesStack = new SharedResourcesStack(
      this,
      "SharedResources",
    );

    const storageStack = new StorageStack(this, "StorageStack", {
      cloudFrontOAI: sharedResourcesStack.cloudFrontOAI,
      production,
    });

    new CdnStack(this, "CdnStack", {
      bucket: storageStack.bucket,
      cloudFrontOAI: sharedResourcesStack.cloudFrontOAI,
    });

    new CronStack(this, "CronStack");
  }
}
