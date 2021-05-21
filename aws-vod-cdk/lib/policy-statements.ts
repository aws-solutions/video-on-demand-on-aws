import { Construct } from 'constructs';
import { aws_iam as iam, Stack } from 'aws-cdk-lib';

export interface PolicyStatementsProps {
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
  public readonly dynamoDbUpdateRoleS3: iam.PolicyStatement;

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

    const partition = Stack.of(this).partition;

    const region = Stack.of(this).region;

    const account = Stack.of(this).account;

    this.archiveSourceRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.archiveSourceRoleLambda = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.archiveSourceRoleLambda = new iam.PolicyStatement({
      actions: ['s3:PutObjectTagging'],
    });

    this.customResourceRoleCloudFront = new iam.PolicyStatement({
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.customResourceRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${partition}:logs:${region}:${account}:log-group:/aws/lambda/*`,
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
      resources: [`arn:${partition}:mediaconvert:${region}:${account}:*`],
    });

    this.customResourceRoleMediaPackageCreateList = new iam.PolicyStatement({
      actions: [
        'mediapackage-vod:CreatePackagingConfiguration',
        'mediapackage-vod:CreatePackagingGroup',
        'mediapackage-vod:ListAssets',
        'mediapackage-vod:ListPackagingConfigurations',
        'mediapackage-vod:ListPackagingGroups',
      ],
      resources: [`arn:${partition}:mediaconvert:${region}:${account}:*`],
    });

    this.customResourceRoleMediaPackageDelete = new iam.PolicyStatement({
      actions: [
        'mediapackage-vod:DeleteAsset',
        'mediapackage-vod:DeletePackagingConfiguration',
      ],
      resources: [
        `arn:${partition}:mediapackage-vod:${region}:${account}:assets/*`,
        `arn:${partition}:mediapackage-vod:${region}:${account}:packaging-configurations/packaging-config-*`,
      ],
    });

    this.customResourceRoleMediaPackageDescribeDelete = new iam.PolicyStatement(
      {
        actions: [
          'mediapackage-vod:DescribePackagingGroup',
          'mediapackage-vod:DeletePackagingGroup',
        ],
        resources: [
          `arn:${partition}:mediapackage-vod:${region}:${account}:packaging-groups/${props.stackName}-packaging-group`,
        ],
      }
    );

    this.customResourceRoleS3 = new iam.PolicyStatement({
      actions: ['s3:PutBucketNotification', 's3:PutObject', 's3:PutObjectAcl'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.destinationBucket = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.dynamoDbUpdateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.dynamoDbUpdateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.dynamoDbUpdateRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.encodeRoleIam = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
    });

    this.encodeRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.encodeRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.encodeRoleMediaConvert = new iam.PolicyStatement({
      actions: ['mediaconvert:CreateJob', 'mediaconvert:GetJobTemplate'],
    });

    this.encodeRoleS3GetObject = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.encodeRoleS3PutObject = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
    });

    this.errorHandlerRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:UpdateItem'],
    });

    this.errorHandlerRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.errorHandlerRoleSns = new iam.PolicyStatement({
      actions: ['sns:Publish'],
    });

    this.inputValidateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${partition}:lambda:${region}:${account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.inputValidateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${partition}:logs:${region}:${account}:log-group:/aws/lambda/*`,
      ],
    });

    this.inputValidateRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      // Resources set in aws-vod-cdk-stak.ts
    });

    this.mediaConvertRoleExecuteApi = new iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [`arn:${partition}:execute-api:${region}:${account}:*`],
    });

    this.mediaConvertRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.mediaInfoRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.mediaInfoRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.mediaInfoRoleS3 = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.mediaPackageAssetRoleIam = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
    });

    this.mediaPackageAssetRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.mediaPackageAssetRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
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
      // Resources set in aws-vod-cdk-stack.ts
    });

    this.outputValidateRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
    });

    this.outputValidateRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.outputValidateRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.outputValidateRoleS3 = new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
    });

    this.profilerRoleDynamoDb = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
    });

    this.profilerRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.profilerRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.snsNotificationRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.snsNotificationRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
    });

    this.snsNotificationRoleSns = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      conditions: { 'aws:SecureTransport': 'true' },
    });

    this.sqsSendMessageRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.sqsSendMessageRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
    });

    this.sqsSendMessageRoleSqs = new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      conditions: { 'aws:SecureTransport': 'true' },
    });

    this.stepFunctionsRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        `arn:${partition}:lambda:${region}:${account}:function:${props.stackName}-ErrorHandlerFunction`,
      ],
    });

    this.stepFunctionsRoleLogs = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:${partition}:logs:${region}:${account}:log-group:/aws/lambda/*`,
      ],
    });

    this.stepFunctionsRoleStates = new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [
        `arn:${partition}:states:${region}:${account}:stateMachine:${props.stackName}-IngestWorkflowStateMachine`,
        `arn:${partition}:states:${region}:${account}:stateMachine:}${props.stackName}-ProcessWorkflowStateMachine`,
        `arn:${partition}:states:${region}:${account}:stateMachine:${props.stackName}-PublishWorkflowStateMachine`,
      ],
    });

    this.stepFunctionServiceRoleLambda = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [`arn:${partition}:lambda:${region}:${account}:function:*`],
    });
  }
}
