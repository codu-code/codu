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
    const storageStack = new StorageStack(this, "StorageStack", {
      production,
    });
    new CdnStack(this, "CdnStack", {
      bucket: storageStack.bucket,
    });
    new CronStack(this, "CronStack");
  }
}
