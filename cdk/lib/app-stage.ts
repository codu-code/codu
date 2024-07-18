import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { CronStack } from "./cron-stack";

interface Props extends cdk.StageProps {
  production?: boolean;
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { production } = props;

    new StorageStack(this, "StorageStack", {
      production,
    });

    new CronStack(this, "CronStack");
  }
}
