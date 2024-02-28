import * as cdk from "aws-cdk-lib";
import { aws_elasticloadbalancingv2 as elbv2 } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import type { IVpc } from "aws-cdk-lib/aws-ec2";
import type { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

interface Props extends cdk.StackProps {
  bucket: cdk.aws_s3.Bucket;
  vpc: IVpc;
  production?: boolean;
}

export class AppStack extends cdk.Stack {
  public readonly appPort: number = 3000;
  public readonly cloudMapNamespace = "service.internal";
  public readonly loadbalancer: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    const { bucket, production, vpc } = props;

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      `/env/domainName`,
      1,
    );

    const wwwDomainName = `www.${domainName}`;

    const cluster = new ecs.Cluster(this, "ServiceCluster", { vpc });

    cluster.addDefaultCloudMapNamespace({ name: this.cloudMapNamespace });

    const appAsset = new ecrAssets.DockerImageAsset(this, "app", {
      directory: "../",
      file: "Dockerfile",
      buildSecrets: {
        SENTRY_AUTH_TOKEN: "type=env",
        DATABASE_URL: "type=env",
      },
      buildArgs: {
        DOCKER_BUILDKIT: "1",
      },
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef");

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:*Object", "SES:*"],
        resources: ["*"],
      }),
    );

    taskDef
      .addContainer("app", {
        image: ecs.ContainerImage.fromDockerImageAsset(appAsset),
        environment: {
          BASE_URL: `https://${wwwDomainName}`,
          DOMAIN_NAME: wwwDomainName,
          NEXTAUTH_URL: `https://${wwwDomainName}`,
          S3_BUCKET_NAME: bucket.bucketName,
        }, // Plain text not for secrets
        secrets: {
          SENTRY_ENVIRONMENT: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "sentryEnvironment",
              { parameterName: "/env/sentry/environment", version: 1 },
            ),
          ),
          SENTRY_DSN: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "sentryDsn",
              { parameterName: "/env/sentry/dsn", version: 1 },
            ),
          ),
          DATABASE_URL: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "dbUrl",
              { parameterName: "/env/db/dbUrl", version: 1 },
            ),
          ),
          GITHUB_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "githubSecret",
              "/env/githubSecret",
            ),
          ),
          GITHUB_ID: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "githubId",
              "/env/githubId",
            ),
          ),
          NEXTAUTH_SECRET: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "nextauthSecret",
              "/env/nextauthSecret",
            ),
          ),
          DISCORD_INVITE_URL: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "discordInviteUrl",
              "/env/discordInviteUrl",
            ),
          ),
          ADMIN_EMAIL: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "adminEmail",
              "/env/adminEmail",
            ),
          ),
          ALGOLIA_ADMIN_KEY: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "algoliaAdminKey",
              { parameterName: "/env/algoliaAdminKey", version: 1 },
            ),
          ),
          ALGOLIA_APP_ID: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "algoliaAppId",
              "/env/algoliaAppId",
            ),
          ),
          ALGOLIA_SEARCH_API: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "algoliaSearchApi",
              "/env/algoliaSearchApi",
            ),
          ),
          ALGOLIA_SOURCE_IDX: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "algoliaIdx",
              "/env/algoliaIdx",
            ),
          ),
          EMAIL_API_KEY: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromSecureStringParameterAttributes(
              this,
              "emailKey",
              { parameterName: "/env/email/key", version: 1 },
            ),
          ),
          EMAIL_API_ENDPOINT: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "emailEndpoint",
              "/env/email/endpoint",
            ),
          ),
          EMAIL_NEWSLETTER_ID: ecs.Secret.fromSsmParameter(
            ssm.StringParameter.fromStringParameterName(
              this,
              "emailNewsletterId",
              "/env/email/id",
            ),
          ),
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
          memoryLimitMiB: production ? 1024 : 512, // Can alter if need more
          cpu: production ? 512 : 256, // Can alter if need more
          publicLoadBalancer: true,
          protocol: elbv2.ApplicationProtocol.HTTP,
        },
      );

    fargateService.listener.addAction("DefaultListenerRule", {
      action: elbv2.ListenerAction.fixedResponse(500, {
        contentType: "text/plain",
        messageBody: "Not Allowed",
      }),
    });

    if (!production) {
      fargateService.listener.addAction("RobotsListenerRule", {
        priority: 1,
        conditions: [elbv2.ListenerCondition.pathPatterns(["/robots.txt"])],
        action: elbv2.ListenerAction.fixedResponse(200, {
          contentType: "text/plain",
          messageBody: `User-agent: *
                        Disallow: /`.replace(/  +/g, ""),
        }),
      });

      fargateService.listener.addAction("SitemapListenerRule", {
        priority: 2,
        conditions: [elbv2.ListenerCondition.pathPatterns(["/sitemap.xml"])],
        action: elbv2.ListenerAction.fixedResponse(404, {
          contentType: "text/plain",
          messageBody:
            "404 Not Found: The requested URL /sitemap.xml was not found on this server.",
        }),
      });
    }

    fargateService.listener.addAction("HostListenerRule", {
      // priority updates if on dev enviornment to block crawlers
      priority: !production ? 3 : 1,
      conditions: [elbv2.ListenerCondition.hostHeaders(["*.codu.co"])],
      action: elbv2.ListenerAction.forward([fargateService.targetGroup]),
    });

    fargateService.targetGroup.configureHealthCheck({
      path: production ? "https://www.codu.co/api/health" : "https://www.dev1.codu.co/api/health",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyHttpCodes: "200",
      unhealthyThresholdCount: 2,
      healthyThresholdCount: 3,
    });

    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: production ? 3 : 1,
    });

    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 90,
    });

    scaling.scaleOnMemoryUtilization("MemoryScaling", {
      targetUtilizationPercent: 90,
    });

    fargateService.service.connections.allowFromAnyIpv4(
      ec2.Port.tcp(this.appPort),
      "app-inbound",
    );

    this.loadbalancer = fargateService.loadBalancer;
  }
}
