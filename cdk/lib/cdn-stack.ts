import * as cdk from "aws-cdk-lib";
import { type Construct } from "constructs";
import { type IBucket } from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as ssm from "aws-cdk-lib/aws-ssm";

interface CdnStackProps extends cdk.StackProps {}

export class CdnStack extends cdk.Stack {
  public readonly cloudFrontOAI: cloudfront.OriginAccessIdentity;
  private distribution: cloudfront.Distribution | undefined;
  private certificate: acm.ICertificate;
  private bucketDomainName: string;
  private zone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/domainName`,
      1,
    );

    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/hostedZoneId`,
      1,
    );

    const bucketDomain = `content.${domainName}`;
    this.bucketDomainName = bucketDomain;

    this.zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId,
        zoneName: bucketDomain,
      },
    );

    this.certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
      domainName: bucketDomain,
      subjectAlternativeNames: [`*.${bucketDomain}`],
      hostedZone: this.zone,
      region: "us-east-1",
      validation: acm.CertificateValidation.fromDns(this.zone),
    });

    this.cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "CloudFrontOAI",
      {
        comment: `OAI for ${id}`,
      },
    );
  }

  public addS3Bucket(bucket: IBucket) {
    if (this.distribution) {
      throw new Error("Distribution already created");
    }

    this.distribution = new cloudfront.Distribution(
      this,
      "UploadDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket, {
            originAccessIdentity: this.cloudFrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: [this.bucketDomainName],
        certificate: this.certificate,
      },
    );

    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: this.bucketDomainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution),
      ),
      zone: this.zone,
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "The domain name of the CloudFront distribution",
    });
  }
}
