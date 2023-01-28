import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as targets from "aws-cdk-lib/aws-route53-targets";

export class CdnStack extends cdk.Stack {
  public readonly appLoadBalancerDNS: cdk.CfnOutput;
  public readonly appPort: number = 3000;
  public readonly cloudMapNamespace = "service.internal";

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/domainName`,
      1
    );

    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/hostedZoneId`,
      1
    );

    const wwwDomainName = `www.${domainName}`;

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, "MyZone", {
      hostedZoneId,
      zoneName: domainName,
    });

    const certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      hostedZone: zone,
      region: "us-east-1",
    });

    const redirectBucket = new s3.Bucket(this, "RedirectBucket", {
      websiteRedirect: {
        hostName: wwwDomainName,
        protocol: s3.RedirectProtocol.HTTPS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const redirectDist = new cloudfront.CloudFrontWebDistribution(
      this,
      "RedirectDistribution",
      {
        defaultRootObject: "",
        originConfigs: [
          {
            behaviors: [{ isDefaultBehavior: true }],
            customOriginSource: {
              domainName: redirectBucket.bucketWebsiteDomainName,
              originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            },
          },
        ],
        viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          certificate,
          {
            aliases: [domainName],
          }
        ),
        comment: `Redirect to ${wwwDomainName} from ${domainName}`,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    );

    const redirectRecordProps = {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(redirectDist)
      ),
    };

    new route53.ARecord(this, "ARedirectAliasRecord", redirectRecordProps);
    new route53.AaaaRecord(
      this,
      "AaaaRedirectAliasRecord",
      redirectRecordProps
    );
  }
}
