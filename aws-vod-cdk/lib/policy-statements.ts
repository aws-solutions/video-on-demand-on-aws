import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';

export interface PolicyStatementsProps {
  stackName: string;
  stackStage: string;
}

export class PolicyStatements extends Construct {
  // ArchiveSourceRole Policy Statements
  public readonly archiveSourceRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly archiveSourceRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly archiveSourceRoleS3PolicyStatement: iam.PolicyStatement;

  // CustomResourceRole Policy Statements
  public readonly customResourceRoleCloudFrontPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleLoggingPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaConvertPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageCreateListPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDeletePolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDescribeDeletePolicyStatement: iam.PolicyStatement;

  // DestinationBucket Policy Statements
  public readonly destinationBucketPolicyStatement: iam.PolicyStatement;

  // DynamoDbUpdateRole Policy Statements
  public readonly dynamoDbUpdateRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleS3PolicyStatement: iam.PolicyStatement;

  // EncodeRole Policy Statements
  public readonly encodeRoleIamPolicyStatement: iam.PolicyStatement;
  public readonly encodeRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly encodeRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly encodeRoleMediaConvertPolicyStatement: iam.PolicyStatement;
  public readonly encodeRoleS3GetObjectPolicyStatement: iam.PolicyStatement;
  public readonly encodeRoleS3PutObjectPolicyStatement: iam.PolicyStatement;

  // ErrorHandlerRole Policy Statements
  public readonly errorHandlerRoleDynamoDbPolicyStatement: iam.PolicyStatement;
  public readonly errorHandlerRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly errorHandlerRoleSnsPolicyStatement: iam.PolicyStatement;

  // InputValidateRole Policy Statements
  public readonly inputValidateRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly inputValidateRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly inputValidateRoleS3PolicyStatement: iam.PolicyStatement;

  // MediaConvertRole Policy Statements
  public readonly mediaConvertRoleS3PolicyStatement: iam.PolicyStatement;

  // MediaInfoRole Policy Statements
  public readonly mediaInfoRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly mediaInfoRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly mediaInfoRoleS3PolicyStatement: iam.PolicyStatement;

  // MediaPackageAssetRole Policy Statements
  public readonly mediaPackageAssetRoleIamPolicyStatement: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly mediaPackageAssetRoleMediaPackagePolicyStatement: iam.PolicyStatement;

  // MediaPackageVodRole Policy Statements
  public readonly mediaPackageVodRoleS3PolicyStatement: iam.PolicyStatement;

  // OutputValidateRole Policy Statements
  public readonly outputValidateRoleDynamoDbPolicyStatement: iam.PolicyStatement;
  public readonly outputValidateRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly outputValidateRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly outputValidateRoleS3PolicyStatement: iam.PolicyStatement;

  // Profiler Role Policy Statements
  public readonly profilerRoleDynamoDbPolicyStatement: iam.PolicyStatement;
  public readonly profilerRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly profilerRoleLogsPolicyStatement: iam.PolicyStatement;

  // SnsNotificationRole Policy Statements
  public readonly snsNotificationRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly snsNotificationRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly snsNotificationRoleSnsPolicyStatement: iam.PolicyStatement;

  // SqsSendMessageRole Policy Statements
  public readonly sqsSendMessageRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly sqsSendMessageRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly sqsSendMessageRoleSqsPolicyStatement: iam.PolicyStatement;

  // StepFunctionsRole Policy Statements
  public readonly stepFunctionsRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionsRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionsRoleStatesPolicyStatement: iam.PolicyStatement;

  // StepFunctionServiceRole Policy Statements
  public readonly stepFunctionServiceRoleLambdaPolicyStatement: iam.PolicyStatement;

  constructor(scope: Construct, id: string, props: PolicyStatementsProps) {
    super(scope, id);

    this.archiveSourceRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.archiveSourceRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.archiveSourceRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:PutObjectTagging'],
    });

    this.customResourceRoleCloudFrontPolicyStatement = new iam.PolicyStatement({
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
    });

    this.customResourceRoleLoggingPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.customResourceRoleMediaConvertPolicyStatement = new iam.PolicyStatement(
      {
        actions: [
          'mediaconvert:CreatePreset',
          'mediaconvert:CreateJobTemplate',
          'mediaconvert:DeletePreset',
          'mediaconvert:DeleteJobTemplate',
          'mediaconvert:DescribeEndpoints',
          'mediaconvert:ListJobTemplates',
        ],
      }
    );

    this.customResourceRoleMediaPackageCreateListPolicyStatement = new iam.PolicyStatement(
      {
        actions: [
          'mediapackage-vod:CreatePackagingConfiguration',
          'mediapackage-vod:CreatePackagingGroup',
          'mediapackage-vod:ListAssets',
          'mediapackage-vod:ListPackagingConfigurations',
          'mediapackage-vod:ListPackagingGroups',
        ],
      }
    );

    this.customResourceRoleMediaPackageDeletePolicyStatement = new iam.PolicyStatement(
      {
        actions: [
          'mediapackage-vod:DeleteAsset',
          'mediapackage-vod:DeletePackagingConfiguration',
        ],
      }
    );

    this.customResourceRoleMediaPackageDescribeDeletePolicyStatement = new iam.PolicyStatement(
      {
        actions: [
          'mediapackage-vod:DescribePackagingGroup',
          'mediapackage-vod:DeletePackagingGroup',
        ],
      }
    );

    this.customResourceRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:PutBucketNotification', 's3:PutObject', 's3:PutObjectAcl'],
    });

    this.destinationBucketPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
    });

    this.dynamoDbUpdateRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.dynamoDbUpdateRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.dynamoDbUpdateRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.encodeRoleIamPolicyStatement = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
    });

    this.encodeRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.encodeRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.encodeRoleMediaConvertPolicyStatement = new iam.PolicyStatement({
      actions: ['mediaconvert:CreateJob', 'mediaconvert:GetJobTemplate'],
    });

    this.encodeRoleS3GetObjectPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.encodeRoleS3PutObjectPolicyStatement = new iam.PolicyStatement({
      actions: ['s3:PutObject'],
    });

    this.errorHandlerRoleDynamoDbPolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:UpdateItem'],
    });

    this.errorHandlerRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.errorHandlerRoleSnsPolicyStatement = new iam.PolicyStatement({
      actions: ['sns:Publish'],
    });

    this.inputValidateRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.inputValidateRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.inputValidateRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.mediaConvertRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
    });

    this.mediaInfoRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.mediaInfoRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.mediaInfoRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
    });

    this.mediaPackageAssetRoleIamPolicyStatement = new iam.PolicyStatement({
      actions: ['iam:PassRole'],
    });

    this.mediaPackageAssetRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.mediaPackageAssetRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.mediaPackageAssetRoleMediaPackagePolicyStatement = new iam.PolicyStatement(
      {
        actions: ['mediapackage-vod:CreateAsset'],
        resources: ['*'],
      }
    );

    this.mediaPackageVodRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetBucketLocation',
        's3:GetBucketRequestPayment',
      ],
    });

    this.outputValidateRoleDynamoDbPolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
    });

    this.outputValidateRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.outputValidateRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.outputValidateRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
    });

    this.profilerRoleDynamoDbPolicyStatement = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
    });

    this.profilerRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.profilerRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.snsNotificationRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.snsNotificationRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
    });

    this.snsNotificationRoleSnsPolicyStatement = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      conditions: { 'aws:SecureTransport': 'true' },
    });

    this.sqsSendMessageRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.sqsSendMessageRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'log:PutLogEvents',
      ],
    });

    this.sqsSendMessageRoleSqsPolicyStatement = new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      conditions: { 'aws:SecureTransport': 'true' },
    });

    this.stepFunctionsRoleLambdaPolicyStatement = new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
    });

    this.stepFunctionsRoleLogsPolicyStatement = new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });

    this.stepFunctionsRoleStatesPolicyStatement = new iam.PolicyStatement({
      actions: ['states:StartExecution'],
    });

    this.stepFunctionServiceRoleLambdaPolicyStatement = new iam.PolicyStatement(
      {
        actions: ['lambda:InvokeFunction'],
      }
    );
  }
}
