import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { CdnStack } from "./cdn-stack";
import { CronStack } from "./cron-stack";

interface Props extends cdk.StageProps {
  production?: boolean;
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { production } = props;

    const cdnStack = new CdnStack(this, "CdnStack", {});

    const storageStack = new StorageStack(this, "StorageStack", {
      production,
      cloudFrontOAI: cdnStack.cloudFrontOAI,
    });

    cdnStack.addS3Bucket(storageStack.bucket);

    new CronStack(this, "CronStack");
  }
}
