import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { AppStack } from "./app-stack";

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: cdk.StageProps) {
    super(scope, id, props);

    const storageStack = new StorageStack(this, "StorageStack");
    new AppStack(this, "AppStack", {
      db: storageStack.db,
      bucket: storageStack.bucket,
    }).addDependency(storageStack);
  }
}
