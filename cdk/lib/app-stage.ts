import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { AppStack } from "./app-stack";
import { CdnStack } from "./cdn-stack";

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
    const appStack = new AppStack(this, "AppStack", {
      vpc: storageStack.vpc,
      bucket: storageStack.bucket,
      production,
    });
    new CdnStack(this, "CdnStack", {
      loadbalancer: appStack.loadbalancer,
    });
  }
}
