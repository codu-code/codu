import * as cdk from "aws-cdk-lib";
import { DefaultStackSynthesizer } from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class EdgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      synthesizer: new DefaultStackSynthesizer(),
    });

    const edgeContentBucket = new s3.Bucket(this, "EdgeContentBucket");
    const myCdnOai = new cloudfront.OriginAccessIdentity(this, "CdnOai");
    edgeContentBucket.grantRead(myCdnOai);

    const edgeFunction = new lambda.Function(this, "EdgeFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../og")),
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    });

    const edgeDistribution = new cloudfront.Distribution(
      this,
      "ImageDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(edgeContentBucket),
          edgeLambdas: [
            {
              functionVersion: edgeFunction.currentVersion,
              eventType: cloudfront.LambdaEdgeEventType.ORIGIN_RESPONSE,
            },
          ],
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      }
    );

    new cdk.CfnOutput(this, "EdgeDistributionDomainName", {
      value: edgeDistribution.distributionDomainName,
    });
  }
}
