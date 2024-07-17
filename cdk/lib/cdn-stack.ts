import * as cdk from "aws-cdk-lib";
import { type Construct } from "constructs";
import { type IBucket } from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ssm from "aws-cdk-lib/aws-ssm";

interface CdnStackProps extends cdk.StackProps {
  bucket: IBucket;
  cloudFrontOAI: cloudfront.IOriginAccessIdentity;
}

export class CdnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/bucketDomainName`,
      1,
    );

    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/hostedZoneId`,
      1,
    );

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: domainName,
      },
    );

    try {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const certificate = new acm.Certificate(this, `Certificate-${uniqueId}`, {
        domainName: domainName,
        subjectAlternativeNames: [`*.${domainName}`],
        validation: acm.CertificateValidation.fromDns(zone),
      });

      const distribution = new cloudfront.Distribution(
        this,
        "UploadDistribution",
        {
          defaultBehavior: {
            origin: new origins.S3Origin(props.bucket, {
              originAccessIdentity: props.cloudFrontOAI,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
          domainNames: [domainName],
          certificate: certificate,
        },
      );

      distribution.node.addDependency(certificate);

      new route53.ARecord(this, "SiteAliasRecord", {
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution),
        ),
        zone,
      });

      new cdk.CfnOutput(this, "DistributionDomainName", {
        value: distribution.distributionDomainName,
        description: "The domain name of the CloudFront distribution",
      });
    } catch (error) {
      console.error("Error creating certificate:", error);
      if (error instanceof Error) {
        new cdk.CfnOutput(this, "CertificateError", {
          value: `Failed to create certificate: ${error.message}`,
          description: "Error encountered while creating the certificate",
        });
      }
    }
  }
}
