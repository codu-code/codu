import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

import { HttpsRedirect } from "aws-cdk-lib/aws-route53-patterns";

interface Props extends cdk.StageProps {
  loadBalancer: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;
  bucket: cdk.aws_s3.Bucket;
  originAccessIdentity: cdk.aws_cloudfront.OriginAccessIdentity;
}

export class CdnStack extends cdk.Stack {
  public readonly appLoadBalancerDNS: cdk.CfnOutput;
  public readonly appPort: number = 3000;
  public readonly cloudMapNamespace = "service.internal";

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { bucket, loadBalancer, originAccessIdentity } = props;

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

    // const customHeaderValue = ssm.StringParameter.valueForStringParameter(
    //   this,
    //   `/env/cf/customHeaderValue`,
    //   1
    // );

    const wwwDomainName = `www.${domainName}`;
    // const uploadDomainName = `uploads.${domainName}`;

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, "MyZone", {
      hostedZoneId,
      zoneName: domainName,
    });

    // const certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
    //   domainName,
    //   subjectAlternativeNames: [`*.${domainName}`],
    //   hostedZone: zone,
    //   region: "us-east-1",
    // });

    // const webCf = new cloudfront.Distribution(this, "WebCfDistribution", {
    //   domainNames: [wwwDomainName],
    //   certificate,

    //   defaultBehavior: {
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    //     origin: new origins.LoadBalancerV2Origin(loadBalancer, {
    //       protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    //       originShieldRegion: "eu-west-1",
    //       customHeaders: {
    //         "X-Forwarded-Port": "443",
    //         "X-Forwarded-Ssl": "on",
    //         "X-FCTL-FRWD": customHeaderValue,
    //       },
    //     }),
    //     originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    //     functionAssociations: [
    //       {
    //         function: new cloudfront.Function(
    //           this,
    //           "WebCfDistributionFunction",
    //           {
    //             code: cloudfront.FunctionCode.fromInline(`
    //               function handler(event) {
    //                 var host = event.request.headers.host.value;
    //                 var request = event.request;
    //                 if (host.includes("cloudfront")) {
    //                   var response = {
    //                     statusCode: 404,
    //                     statusDescription: "Not found",
    //                   };
    //                   return response;
    //                 }
    //                 return request;
    //               }
    //             `),
    //           }
    //         ),
    //         eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    //       },
    //     ],
    //   },
    // });

    // const uploadCf = new cloudfront.Distribution(this, "UploadCfDistribution", {
    //   domainNames: [uploadDomainName],
    //   certificate,
    //   defaultBehavior: {
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    //     allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
    //     origin: new origins.S3Origin(bucket, {
    //       originAccessIdentity,
    //     }),
    //     originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    //     functionAssociations: [
    //       {
    //         function: new cloudfront.Function(
    //           this,
    //           "UploadCfDistributionFunction",
    //           {
    //             code: cloudfront.FunctionCode.fromInline(`
    //                 function handler(event) {
    //                   var host = event.request.headers.host.value;
    //                   var request = event.request;
    //                   if (host.includes("cloudfront")) {
    //                     var response = {
    //                       statusCode: 404,
    //                       statusDescription: "Not found",
    //                     };
    //                     return response;
    //                   }
    //                   return request;
    //                 }
    //               `),
    //           }
    //         ),
    //         eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    //       },
    //     ],
    //   },
    // });

    // new route53.ARecord(this, "SiteAliasRecord", {
    //   recordName: wwwDomainName,
    //   target: route53.RecordTarget.fromAlias(
    //     new targets.CloudFrontTarget(webCf)
    //   ),
    //   zone,
    // });

    // new route53.ARecord(this, "UploadAliasRecord", {
    //   recordName: uploadDomainName,
    //   target: route53.RecordTarget.fromAlias(
    //     new targets.CloudFrontTarget(uploadCf)
    //   ),
    //   zone,
    // });

    // new route53.AaaaRecord(this, "AaaaAlias", {
    //   zone,
    //   recordName: wwwDomainName,
    //   target: route53.RecordTarget.fromAlias(
    //     new targets.CloudFrontTarget(webCf)
    //   ),
    // });

    new HttpsRedirect(this, "RedirectToWww", {
      recordNames: [domainName],
      targetDomain: wwwDomainName,
      zone: route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
        hostedZoneId,
        zoneName: domainName,
      }),
    });
  }
}
