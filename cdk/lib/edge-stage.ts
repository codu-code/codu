import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import { EdgeStack } from "./edge-stack";

export class AppStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, { ...props });

    new EdgeStack(this, "EdgeStack");
  }
}
