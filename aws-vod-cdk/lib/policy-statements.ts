import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';

export interface PolicyStatementsProps {
  stackName: string;
  stackStage: string;
}

export class PolicyStatements extends Construct {
  public readonly customResourceRoleCloudFrontPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleLoggingPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaConvertPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageCreateListPolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDeletePolicyStatement: iam.PolicyStatement;
  public readonly customResourceRoleMediaPackageDescribeDeletePolicyStatement: iam.PolicyStatement;
  public readonly destinationBucketPolicyStatement: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly dynamoDbUpdateRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly inputValidateRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly inputValidateRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly inputValidateRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly mediaConvertRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly mediaInfoRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly mediaInfoRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly mediaInfoRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly mediaPackageVodRoleS3PolicyStatement: iam.PolicyStatement;
  public readonly profilerRoleDynamoDbPolicyStatement: iam.PolicyStatement;
  public readonly profilerRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly profilerRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionsRoleLambdaPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionsRoleLogsPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionsRoleStatesPolicyStatement: iam.PolicyStatement;
  public readonly stepFunctionServiceRoleLambdaPolicyStatement: iam.PolicyStatement;

  constructor(scope: Construct, id: string, props: PolicyStatementsProps) {
    super(scope, id);

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

    this.mediaPackageVodRoleS3PolicyStatement = new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:GetBucketLocation',
        's3:GetBucketRequestPayment',
      ],
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
