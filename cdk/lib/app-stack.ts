import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import { HttpsRedirect } from "aws-cdk-lib/aws-route53-patterns";

interface Props extends cdk.StageProps {
  db: cdk.aws_rds.DatabaseInstance;
  bucket: cdk.aws_s3.Bucket;
  production?: boolean;
}

export class AppStack extends cdk.Stack {
  public readonly appLoadBalancerDNS: cdk.CfnOutput;
  public readonly appPort: number = 8080;
  public readonly cloudMapNamespace = "service.internal";

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { db, bucket, production } = props;

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

    const cluster = new ecs.Cluster(this, "ServiceCluster");

    cluster.addDefaultCloudMapNamespace({ name: this.cloudMapNamespace });

    const appService = this.createFargateService(
      cluster,
      domainName,
      hostedZoneId,
      db,
      bucket,
      !!production
    );

    this.appLoadBalancerDNS = new cdk.CfnOutput(this, "AppLoadBalancerDNS", {
      value: appService.loadBalancer.loadBalancerDnsName,
    });
  }

  private createFargateService(
    cluster: ecs.Cluster,
    domainName: string,
    hostedZoneId: string,
    db: cdk.aws_rds.DatabaseInstance,
    bucket: cdk.aws_s3.Bucket,
    production: boolean
  ) {
    if (!db.secret) throw new Error("DB Secret required");
    const wwwDomainName = `www.${domainName}`;

    const appAsset = new ecrAssets.DockerImageAsset(this, "app", {
      directory: "../",
      file: "Dockerfile",
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef");

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*Object"],
        resources: ["arn:aws:s3:::*"],
      })
    );

    const fatomPublicId = production
      ? ssm.StringParameter.valueForStringParameter(
          this,
          `/env/fatomPublicId`,
          1
        )
      : "";

    taskDef
      .addContainer("app", {
        image: ecs.ContainerImage.fromDockerImageAsset(appAsset),
        essential: true,
        environment: {
          BASE_URL: `https://${wwwDomainName}`,
          NEXT_PUBLIC_FATHOM_SITE_ID: fatomPublicId,
          S3_BUCKET_NAME: bucket.bucketName,
        }, // Plain text not for secrets
        secrets: {
          DB_USERNAME: ecs.Secret.fromSecretsManager(db.secret, "username"),
          DB_HOST: ecs.Secret.fromSecretsManager(db.secret, "host"),
          DB_PORT: ecs.Secret.fromSecretsManager(db.secret, "port"),
          DB_NAME: ecs.Secret.fromSecretsManager(db.secret, "dbname"),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(db.secret, "password"),
          GITHUB_ID: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "githubId",
              {
                parameterName: "/env/githubId",
              }
            )
          ),
          GITHUB_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "githubSecret",
              {
                parameterName: "/env/githubSecret",
              }
            )
          ),
          NEXTAUTH_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "nextauthSecret",
              {
                parameterName: "/env/nextauthSecret",
              }
            )
          ),
          // ACCESS_KEY: ecs.Secret.fromSsmParameter(
          //   ssm.StringParameter.fromSecureStringParameterAttributes(
          //     this,
          //     "accessKey",
          //     {
          //       parameterName: "/env/accessKey",
          //     }
          //   )
          // ),
          // SECRET_KEY: ecs.Secret.fromSsmParameter(
          //   ssm.StringParameter.fromSecureStringParameterAttributes(
          //     this,
          //     "secretKey",
          //     {
          //       parameterName: "/env/secretKey",
          //     }
          //   )
          // ),
        },

        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: "AppContainer",
          logRetention: logs.RetentionDays.THREE_DAYS,
        }),
      })
      .addPortMappings({ containerPort: this.appPort, hostPort: this.appPort });

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "ecs-service",
        {
          cluster,
          taskDefinition: taskDef,
          memoryLimitMiB: 512,
          cpu: 256,
          publicLoadBalancer: true,
        }
      );

    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 70,
    });

    fargateService.service.connections.allowFromAnyIpv4(
      ec2.Port.tcp(this.appPort),
      "app-inbound"
    );

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

    const cf = new cloudfront.Distribution(this, "myDist", {
      domainNames: [wwwDomainName],
      certificate,
      defaultBehavior: {
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        functionAssociations: [
          {
            function: new cloudfront.Function(this, "Function", {
              code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                  var host = event.request.headers.host.value;
                  var request = event.request;
                  if (host.includes("cloudfront")) {
                    var response = {
                      statusCode: 404,
                      statusDescription: "Not found",
                    };
                    return response;
                  }
                  return request;
                }                  
              `),
            }),
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
    });

    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: wwwDomainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf)),
      zone,
    });

    new route53.AaaaRecord(this, "Alias", {
      zone,
      recordName: wwwDomainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf)),
    });

    new HttpsRedirect(this, "Redirect", {
      recordNames: [domainName],
      targetDomain: wwwDomainName,
      zone: route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
        hostedZoneId,
        zoneName: domainName,
      }),
    });

    return fargateService;
  }
}
