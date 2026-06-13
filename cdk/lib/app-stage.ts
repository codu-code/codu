import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { CronStack } from "./cron-stack";
import { IamStack } from "./iam-stack";

interface Props extends cdk.StageProps {
  production?: boolean;
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { production } = props;

    const storage = new StorageStack(this, "StorageStack", {
      production,
    });

    new CronStack(this, "CronStack");

    // IAM principal the Vercel app authenticates as — grants live next to the
    // resources it touches (S3 bucket, rate-limit table).
    new IamStack(this, "IamStack", {
      bucket: storage.bucket,
      rateLimitTable: storage.rateLimitTable,
    });
  }
}
