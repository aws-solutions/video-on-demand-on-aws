import { Construct } from 'constructs';
import { aws_iam as iam, Stack } from 'aws-cdk-lib';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';
import { CanonicalUserPrincipal } from 'aws-cdk-lib/lib/aws-iam';
import { CloudFronts } from './cloudfronts';
import { S3Buckets } from './s3-buckets';
import { DynamoDbTables } from './dynamodb-tables';
import { SqsQueues } from './sqs-queues';
import { SnsTopics } from './sns-topics';

export interface PolicyStatementsProps {
  account: string;
  cloudFronts: CloudFronts;
  cloudfrontOriginAccessIdentities: CloudfrontOriginAccessIdentities;
  dynamoDbTables: DynamoDbTables;
  partition: string;
  region: string;
  s3Buckets: S3Buckets;
  snsTopics: SnsTopics;
  sqsQueues: SqsQueues;
  stackName: string;
}

export class PolicyStatements extends Construct {
  // ArchiveSourceRole Policy Statements
  public readonly archiveSourceRoleLambda: iam.PolicyStatement;
  public readonly archiveSourceRoleLogs: iam.PolicyStatement;
  public readonly archiveSourceRoleS3: iam.PolicyStatement;

  // CustomResourceRole Policy Statements
  public readonly customResourceRoleCloudFront: iam.PolicyStatement;
  public readonly customResourceRoleLogs: iam.PolicyStatement;
  public readonly customResourceRoleMediaConvert: iam.PolicyStatement;
  public readonly customResourceRoleS3: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageCreateList: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDelete: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDescribeDelete: iam.PolicyStatement;

  // DestinationBucket Policy Statements
  public readonly destinationBucket: iam.PolicyStatement;

  // DynamoDbUpdateRole Policy Statements
  public readonly dynamoDbUpdateRoleLambda: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleLogs: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleDynamoDb: iam.PolicyStatement;

  // EncodeRole Policy Statements
  public readonly encodeRoleIam: iam.PolicyStatement;
  public readonly encodeRoleLambda: iam.PolicyStatement;
  public readonly encodeRoleLogs: iam.PolicyStatement;
  public readonly encodeRoleMediaConvert: iam.PolicyStatement;
  public readonly encodeRoleS3GetObject: iam.PolicyStatement;
  public readonly encodeRoleS3PutObject: iam.PolicyStatement;

  // ErrorHandlerRole Policy Statements
  public readonly errorHandlerRoleDynamoDb: iam.PolicyStatement;
  public readonly errorHandlerRoleLogs: iam.PolicyStatement;
  public readonly errorHandlerRoleSns: iam.PolicyStatement;

  // InputValidateRole Policy Statements
  public readonly inputValidateRoleLambda: iam.PolicyStatement;
  public readonly inputValidateRoleLogs: iam.PolicyStatement;
  public readonly inputValidateRoleS3: iam.PolicyStatement;

  // MediaConvertRole Policy Statements
  public readonly mediaConvertRoleExecuteApi: iam.PolicyStatement;
  public readonly mediaConvertRoleS3: iam.PolicyStatement;

  // MediaInfoRole Policy Statements
  public readonly mediaInfoRoleLambda: iam.PolicyStatement;
  public readonly mediaInfoRoleLogs: iam.PolicyStatement;
  public readonly mediaInfoRoleS3: iam.PolicyStatement;

  // MediaPackageAssetRole Policy Statements
  public readonly mediaPackageAssetRoleIam: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleLambda: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleLogs: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleMediaPackage: iam.PolicyStatement;

  // MediaPackageVodRole Policy Statements
  public readonly mediaPackageVodRoleS3: iam.PolicyStatement;

  // OutputValidateRole Policy Statements
  public readonly outputValidateRoleDynamoDb: iam.PolicyStatement;
  public readonly outputValidateRoleLambda: iam.PolicyStatement;
  public readonly outputValidateRoleLogs: iam.PolicyStatement;
  public readonly outputValidateRoleS3: iam.PolicyStatement;

  // Profiler Role Policy Statements
  public readonly profilerRoleDynamoDb: iam.PolicyStatement;
  public readonly profilerRoleLambda: iam.PolicyStatement;
  public readonly profilerRoleLogs: iam.PolicyStatement;

  // SnsNotificationRole Policy Statements
  public readonly snsNotificationRoleLambda: iam.PolicyStatement;
  public readonly snsNotificationRoleLogs: iam.PolicyStatement;
  public readonly snsNotificationRoleSns: iam.PolicyStatement;

  // SqsSendMessageRole Policy Statements
  public readonly sqsSendMessageRoleLambda: iam.PolicyStatement;
  public readonly sqsSendMessageRoleLogs: iam.PolicyStatement;
  public readonly sqsSendMessageRoleSqs: iam.PolicyStatement;

  // StepFunctionsRole Policy Statements
  public readonly stepFunctionsRoleLambda: iam.PolicyStatement;
  public readonly stepFunctionsRoleLogs: iam.PolicyStatement;
  public readonly stepFunctionsRoleStates: iam.PolicyStatement;

  // StepFunctionServiceRole Policy Statements
  public readonly stepFunctionServiceRoleLambda: iam.PolicyStatement;

  constructor(scope: Construct, id: string, props: PolicyStatementsProps) {
    super(scope, id);

    this.archiveSourceRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.archiveSourceRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.archiveSourceRoleS3 = new iam.PolicyStatement({
      actions: ['s3:PutObjectTagging'],
      resources: [props.s3Buckets.source.bucketArn],
    });

    this.customResourceRoleCloudFront = new iam.PolicyStatement({
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
      resources: [
        `arn:${props.partition}:cloudfront::${props.account}:distribution/${props.cloudFronts.distribution.distributionId}`,
      ],
    });

    this.customResourceRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.customResourceRoleMediaConvert = new iam.PolicyStatement({
      actions: [
        'mediaconvert:CreatePreset',
        'mediaconvert:CreateJobTemplate',
        'mediaconvert:DeletePreset',
        'mediaconvert:DeleteJobTemplate',
        'mediaconvert:DescribeEndpoints',
        'mediaconvert:ListJobTemplates',
      ],
      resources: [
        `arn:${props.partition}:mediaconvert:${props.region}:${props.account}:*`,
      ],
    });

    this.customResourceRoleMediaPackageCreateList = new iam.PolicyStatement({
      actions: [
        'mediapackage-vod:CreatePackagingConfiguration',
        'mediapackage-vod:CreatePackagingGroup',
        'mediapackage-vod:ListAssets',
        'mediapackage-vod:ListPackagingConfigurations',
        'mediapackage-vod:ListPackagingGroups',
      ],
      resources: [
        `arn:${props.partition}:mediaconvert:${props.region}:${props.account}:*`,
      ],
    });

    this.customResourceRoleMediaPackageDelete = new iam.PolicyStatement({
      actions: [
        'mediapackage-vod:DeleteAsset',
        'mediapackage-vod:DeletePackagingConfiguration',
      ],
      resources: [
        `arn:${props.partition}:mediapackage-vod:${props.region}:${props.account}:assets/*`,
        `arn:${props.partition}:mediapackage-vod:${props.region}:${props.account}:packaging-configurations/packaging-config-*`,
      ],
    });

    this.customResourceRoleMediaPackageDescribeDelete = new iam.PolicyStatement(
      {
        actions: [
          'mediapackage-vod:DescribePackagingGroup',
          'mediapackage-vod:DeletePackagingGroup',
        ],
        resources: [
          `arn:${props.partition}:mediapackage-vod:${props.region}:${props.account}:packaging-groups/${props.stackName}-packaging-group`,
        ],
      }
    );

    this.customResourceRoleS3 = new iam.PolicyStatement({
      actions: ['s3:PutBucketNotification', 's3:PutObject', 's3:PutObjectAcl'],
      resources: [props.s3Buckets.source.bucketArn],
    });

    this.destinationBucket = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      principals: [
        new CanonicalUserPrincipal(
          props.cloudfrontOriginAccessIdentities.destination.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [
        `arn:${props.partition}:s3:::${props.s3Buckets.destination}/*`,
      ],
    });

    this.dynamoDbUpdateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.dynamoDbUpdateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.dynamoDbUpdateRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamoDb:UpdateItem'],
      resources: [
        `arn:${props.partition}:dynamodb:${props.region}:${props.account}:table/${props.dynamoDbTables.videoInfo.tableName}`,
      ],
    });

    this.encodeRoleIam = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.encodeRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.encodeRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.encodeRoleMediaConvert = new iam.PolicyStatement({
      actions: ['mediaconvert:CreateJob', 'mediaconvert:GetJobTemplate'],
      resources: [
        `arn:${props.partition}:mediaconvert:${props.region}:${props.account}:*`,
      ],
    });

    this.encodeRoleS3GetObject = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [props.s3Buckets.source.bucketArn],
    });

    this.encodeRoleS3PutObject = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [props.s3Buckets.destination.bucketArn],
    });

    this.errorHandlerRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:UpdateItem'],
      resources: [
        `arn:${props.partition}:dynamodb:${props.region}:${props.account}:table/${props.dynamoDbTables.videoInfo.tableName}`,
      ],
    });

    this.errorHandlerRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.errorHandlerRoleSns = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.snsTopics.notifications.topicArn],
    });

    this.inputValidateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.inputValidateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.inputValidateRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${props.s3Buckets.source.bucketArn}/*`],
    });

    this.mediaConvertRoleExecuteApi = new iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [
        `arn:${props.partition}:execute-api:${props.region}:${props.account}:*`,
      ],
    });

    this.mediaConvertRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [
        `${props.s3Buckets.source.bucketArn}/*`,
        `${props.s3Buckets.destination.bucketArn}/*`,
      ],
    });

    this.mediaInfoRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.mediaInfoRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.mediaInfoRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${props.s3Buckets.source.bucketArn}/*`],
    });

    this.mediaPackageAssetRoleIam = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.mediaPackageAssetRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.mediaPackageAssetRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*s`,
      ],
    });

    this.mediaPackageAssetRoleMediaPackage = new iam.PolicyStatement({
      actions: ['mediapackage-vod:CreateAsset'],
      resources: ['*'],
    });

    this.mediaPackageVodRoleS3 = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetBucketLocation',
        's3:GetBucketRequestPayment',
      ],
      resources: [
        `${props.s3Buckets.destination.bucketArn}`,
        `${props.s3Buckets.destination.bucketArn}/*`,
      ],
    });

    this.outputValidateRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
      resources: [
        `arn:${props.partition}:dynamodb:${props.region}:${props.account}:table/${props.dynamoDbTables.videoInfo.tableName}`,
      ],
    });

    this.outputValidateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.outputValidateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.outputValidateRoleS3 = new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      resources: [props.s3Buckets.destination.bucketArn],
    });

    this.profilerRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
      resources: [
        `arn:${props.partition}:dynamodb:${props.region}:${props.account}:table/${props.dynamoDbTables.videoInfo.tableName}`,
      ],
    });

    this.profilerRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.profilerRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.snsNotificationRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.snsNotificationRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.snsNotificationRoleSns = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [props.snsTopics.notifications.topicArn],
      conditions: { Bool: { 'aws:SecureTransport': 'true' } },
    });

    this.sqsSendMessageRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:aws:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.sqsSendMessageRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.sqsSendMessageRoleSqs = new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [props.sqsQueues.main.queueArn],
      conditions: { Bool: { 'aws:SecureTransport': 'true' } },
    });

    this.stepFunctionsRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.stepFunctionsRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${props.partition}:logs:${props.region}:${props.account}:log-group:/aws/lambda/*`,
      ],
    });

    this.stepFunctionsRoleStates = new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [
        `arn:${props.partition}:states:${props.region}:${props.account}:stateMachine:${props.stackName}-IngestWorkflowStateMachine`,
        `arn:${props.partition}:states:${props.region}:${props.account}:stateMachine:}${props.stackName}-ProcessWorkflowStateMachine`,
        `arn:${props.partition}:states:${props.region}:${props.account}:stateMachine:${props.stackName}-PublishWorkflowStateMachine`,
      ],
    });

    this.stepFunctionServiceRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${props.partition}:lambda:${props.region}:${props.account}:function:*`,
      ],
    });
  }
}
