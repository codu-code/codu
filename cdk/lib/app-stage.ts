import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage-stack";
import { AppStack } from "./app-stack";

interface Props extends cdk.StageProps {
  domainName: string;
  hostedZoneId: string;
}

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { domainName, hostedZoneId } = props;

    const storageStack = new StorageStack(this, "StorageStack");
    new AppStack(this, "AppStack", {
      domainName,
      hostedZoneId,
      db: storageStack.db,
    }).addDependency(storageStack);
  }
}
