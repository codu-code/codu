import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as backup from "aws-cdk-lib/aws-backup";
import * as events from "aws-cdk-lib/aws-events";
import * as kms from "aws-cdk-lib/aws-kms";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

interface Props extends cdk.StackProps {
  production?: boolean;
}

export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly db: rds.DatabaseInstance;
  public readonly vpc: ec2.Vpc;
  public readonly rateLimitTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: Props) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "StorageStackVpc", {
      natGateways: 1,
    });

    const { vpc } = this;

    // ── Rate-limit counters (DynamoDB) ──
    // Fixed-window counters keyed by `pk`, auto-expired via the `ttl`
    // attribute. On-demand billing — pay only per request, no capacity to plan.
    // The app reads the table name from RATE_LIMIT_TABLE (see SSM param below);
    // its IAM principal needs dynamodb:UpdateItem on this table.
    this.rateLimitTable = new dynamodb.Table(this, "RateLimitTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: props?.production
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Publish the generated table name so the app env (RATE_LIMIT_TABLE) can
    // resolve it without hardcoding.
    new ssm.StringParameter(this, "RateLimitTableNameParam", {
      parameterName: "/env/rate-limit-table",
      stringValue: this.rateLimitTable.tableName,
    });

    new cdk.CfnOutput(this, "RateLimitTableName", {
      value: this.rateLimitTable.tableName,
      description: "Set RATE_LIMIT_TABLE to this in the app environment",
    });

    // S3 bucket
    const bucketName = ssm.StringParameter.valueForStringParameter(
      this,
      "/env/bucketname",
      1,
    );

    this.bucket = new s3.Bucket(this, "uploadBucket", {
      bucketName,
      removalPolicy: props?.production
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"], // TODO: Lock down on prod
          allowedHeaders: ["*"],
        },
      ],
    });

    // Lambda for resizing avatar uploads
    const s3AvatarEventHandler = new NodejsFunction(this, "ResizeAvatar", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/avatarResize/index.js"),
      timeout: cdk.Duration.seconds(120),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/avatarResize/package-lock.json",
      ),
      bundling: {
        nodeModules: ["sharp", "@aws-sdk/client-s3"],
      },
    });

    // Lambda for resizing uploads
    const s3UploadEventHandler = new NodejsFunction(this, "ResizeUploads", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "/../lambdas/uploadResize/index.js"),
      timeout: cdk.Duration.seconds(120),
      depsLockFilePath: path.join(
        __dirname,
        "/../lambdas/uploadResize/package-lock.json",
      ),
      bundling: {
        nodeModules: ["sharp", "@aws-sdk/client-s3"],
      },
    });

    this.bucket.grantReadWrite(s3AvatarEventHandler);
    this.bucket.grantReadWrite(s3UploadEventHandler);

    s3AvatarEventHandler.addEventSource(
      new S3EventSource(this.bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: "u/" }],
      }),
    );

    s3UploadEventHandler.addEventSource(
      new S3EventSource(this.bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: "uploads/" }],
      }),
    );

    const dbUsername = ssm.StringParameter.valueForStringParameter(
      this,
      "/env/db/username",
      1,
    );

    const dbName = ssm.StringParameter.valueForStringParameter(
      this,
      "/env/db/name",
      1,
    );

    // PG15 engine, shared by the instance and its parameter group so they can
    // never drift. `.of()` because this aws-cdk-lib (2.233.0) predates the
    // VER_15_17 enum; 15.17 is the lowest 15.x RDS offers as a valid
    // major-upgrade target from 14.22. PG15+ is required by the schema —
    // point_event dedupe uses `UNIQUE NULLS NOT DISTINCT` (Postgres 15). Local
    // dev runs postgres:15-alpine, keeping RDS in step.
    const pgVersion = rds.PostgresEngineVersion.of("15.17", "15");

    // Pin `rds.force_ssl` ON explicitly rather than inheriting it from the
    // default.postgres15 group, whose default flipped 0 -> 1 vs postgres14 and
    // silently required SSL after the major upgrade. All app + migrate
    // connections must therefore carry `sslmode=require` in DATABASE_URL.
    const parameterGroup = new rds.ParameterGroup(this, "db-parameter-group", {
      engine: rds.DatabaseInstanceEngine.postgres({ version: pgVersion }),
      description: "Codú Postgres 15 — force_ssl pinned on",
      parameters: {
        "rds.force_ssl": "1",
      },
    });

    // RDS
    this.db = new rds.DatabaseInstance(this, "db-instance", {
      instanceIdentifier: "codu-rds",
      databaseName: dbName,
      engine: rds.DatabaseInstanceEngine.postgres({ version: pgVersion }),
      parameterGroup,
      credentials: rds.Credentials.fromPassword(
        dbUsername,
        cdk.SecretValue.ssmSecure("/env/db/password", "1"),
      ),
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        props?.production ? ec2.InstanceSize.MEDIUM : ec2.InstanceSize.MICRO,
      ),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      publiclyAccessible: true,
      deletionProtection: props?.production ?? false,
      autoMinorVersionUpgrade: true,
      // Required for the 14.5 -> 15.x major-version upgrade; RDS rejects a
      // major engine change without it. Safe to leave enabled (it permits, it
      // doesn't force, future major upgrades via CDK).
      allowMajorVersionUpgrade: true,
      backupRetention: props?.production
        ? cdk.Duration.days(7) // 7 days retention for production
        : cdk.Duration.days(1), // 1 day retention for non-production (minimum allowed)
      preferredBackupWindow: "03:00-05:00", // UTC time, extended to 2 hours
      preferredMaintenanceWindow: "Sat:06:00-Sat:07:00", // Saturday 6:00-7:00 UTC
      deleteAutomatedBackups: props?.production ? false : true,
    });

    // Allow connections on default port from any IPV4
    // TODO: Lock down on prod
    this.db.connections.allowDefaultPortFromAnyIpv4();

    if (props?.production) {
      // Create a backup vault
      const backupVault = new backup.BackupVault(this, "MyBackupVault", {
        backupVaultName: "MyProductionDatabaseBackupVault",
        encryptionKey: new kms.Key(this, "MyBackupVaultKey"),
      });

      // Create a backup plan
      const plan = new backup.BackupPlan(this, "MyBackupPlan", {
        backupPlanName: "MyProductionDatabaseBackupPlan",
        backupVault: backupVault,
      });

      // Add a rule to the backup plan
      plan.addRule(
        new backup.BackupPlanRule({
          completionWindow: cdk.Duration.hours(2),
          startWindow: cdk.Duration.hours(1),
          scheduleExpression: events.Schedule.cron({
            // Set to 12:00 AM UTC every day
            minute: "0",
            hour: "0",
          }),
          deleteAfter: cdk.Duration.days(14), // Retain backups for 14 days
        }),
      );

      // Add the RDS instance as a resource to the backup plan
      plan.addSelection("MyBackupSelection", {
        resources: [backup.BackupResource.fromRdsDatabaseInstance(this.db)],
      });
    }
  }
}
