import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

interface Props extends cdk.StageProps {
  db: cdk.aws_rds.DatabaseInstance;
  bucket: cdk.aws_s3.Bucket;
  production?: boolean;
}

export class AppStack extends cdk.Stack {
  public readonly appPort: number = 3000;
  public readonly cloudMapNamespace = "service.internal";
  public readonly loadbalancer: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { db, bucket, production } = props;

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/domainName`,
      1
    );

    const cluster = new ecs.Cluster(this, "ServiceCluster");

    cluster.addDefaultCloudMapNamespace({ name: this.cloudMapNamespace });

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
          NEXTAUTH_URL: `https://${wwwDomainName}`,
          NEXT_PUBLIC_FATHOM_SITE_ID: fatomPublicId,
          S3_BUCKET_NAME: bucket.bucketName,
        }, // Plain text not for secrets
        secrets: {
          DATABASE_URL: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "dbUrl",
              { parameterName: "/env/db/dbUrl", version: 1 }
            )
          ),
          GITHUB_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "githubSecret",
              "/env/githubSecret"
            )
          ),
          GITHUB_ID: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "githubId",
              "/env/githubId"
            )
          ),
          NEXTAUTH_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "nextauthSecret",
              "/env/nextauthSecret"
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

    this.loadbalancer = fargateService.loadBalancer;
  }
}
