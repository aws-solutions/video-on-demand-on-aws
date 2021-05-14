import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cloudfront } from './cloudfront';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';
import { DynamoDbTables } from './dynamodb-tables';
import { EventPatterns } from './event-patterns';
import { IamRoles } from './iam-roles';
import { LambdaFunctions } from './lambda-functions';
import { LambdaPermissions } from './lambda-permissions';
import { PolicyDocuments } from './policy-documents';
import { PolicyStatements } from './policy-statements';
import { Rules } from './rules';
import { S3Buckets } from './s3-buckets';
import { SnsTopics } from './sns-topics';
import { SqsQueues } from './sqs-queues';
import { StepFunctions } from './step-functions';
import { StepFunctionsChoices } from './step-functions-choices';
import { StepFunctionsPasses } from './step-functions-passes';
import { StepFunctionsTasks } from './step-functions-tasks';

export class AwsVodCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Attempt to set constant variables from context;
    // set default values (empty string) if not found
    const stackStage =
      this.node.tryGetContext('stackStage') !== undefined
        ? `${this.node.tryGetContext('stackStage')}-`
        : '';

    const stackName =
      this.node.tryGetContext('stackName') !== undefined
        ? `${this.node.tryGetContext('stackName')}-`
        : '';

    // Initialize Custom Constructs
    const cloudfront = new Cloudfront(this, 'Cloudfront', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const cloudfrontOriginAccessIdentities = new CloudfrontOriginAccessIdentities(
      this,
      'CloudFrontOriginAccessIdentities',
      {
        stackName: stackName,
        stackStage: stackStage,
      }
    );

    const dynamoDbTables = new DynamoDbTables(this, 'DynamoDbTables', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const eventPatterns = new EventPatterns(this, 'EventPatterns', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const iamRoles = new IamRoles(this, 'IamRoles', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const lambdaPermissions = new LambdaPermissions(this, 'Permissions', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const policyDocuments = new PolicyDocuments(this, 'PolicyDocuments', {
      stackStage: stackStage,
      stackName: stackName,
    });

    const policyStatements = new PolicyStatements(this, 'PolicyStatements', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const rules = new Rules(this, 'Rules', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const s3Buckets = new S3Buckets(this, 'S3Buckets', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const snsTopics = new SnsTopics(this, 'SnsTopics', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const sqsQueues = new SqsQueues(this, 'SqsQueues', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const stepFunctions = new StepFunctions(this, 'StepFunctions', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const stepFunctionsChoices = new StepFunctionsChoices(
      this,
      'StepFunctionsChoices',
      {
        stackName: stackName,
        stackStage: stackStage,
      }
    );

    const stepFunctionsPasses = new StepFunctionsPasses(
      this,
      'StepFunctionsPasses',
      {
        stackName: stackName,
        stackStage: stackStage,
      }
    );

    const stepFunctionsTasks = new StepFunctionsTasks(
      this,
      'StepFunctionsTasks',
      {
        stackName: stackName,
        stackStage: stackStage,
      }
    );

    // Associate Policy Statements with Policy Documents
    policyDocuments.destinationBucket.addStatements(
      policyStatements.destinationBucket
    );

    // Associate Policy Statements with IAM Roles
    iamRoles.archiveSource.addToPolicy(
      policyStatements.archiveSourceRoleLambda
    );

    iamRoles.archiveSource.addToPolicy(policyStatements.archiveSourceRoleLogs);

    iamRoles.archiveSource.addToPolicy(policyStatements.archiveSourceRoleS3);

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleCloudFront
    );

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleLogs
    );

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleMediaConvert
    );

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleMediaPackageCreateList
    );

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleMediaPackageDelete
    );

    iamRoles.customResource.addToPolicy(
      policyStatements.customResourceRoleMediaPackageDescribeDelete
    );

    iamRoles.customResource.addToPolicy(policyStatements.customResourceRoleS3);

    iamRoles.dynamoDbUpdate.addToPolicy(
      policyStatements.dynamoDbUpdateRoleLambda
    );

    iamRoles.dynamoDbUpdate.addToPolicy(
      policyStatements.dynamoDbUpdateRoleLogs
    );

    iamRoles.dynamoDbUpdate.addToPolicy(policyStatements.dynamoDbUpdateRoleS3);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleIam);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleLambda);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleLogs);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleMediaConvert);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleS3GetObject);

    iamRoles.encode.addToPolicy(policyStatements.encodeRoleS3PutObject);

    iamRoles.errorHandler.addToPolicy(
      policyStatements.errorHandlerRoleDynamoDb
    );

    iamRoles.errorHandler.addToPolicy(policyStatements.errorHandlerRoleLogs);

    iamRoles.errorHandler.addToPolicy(policyStatements.errorHandlerRoleSns);

    iamRoles.inputValidate.addToPolicy(
      policyStatements.inputValidateRoleLambda
    );

    iamRoles.inputValidate.addToPolicy(policyStatements.inputValidateRoleLogs);

    iamRoles.inputValidate.addToPolicy(policyStatements.inputValidateRoleS3);

    iamRoles.mediaConvert.addToPolicy(policyStatements.mediaConvertRoleS3);

    iamRoles.mediaInfo.addToPolicy(policyStatements.mediaInfoRoleLambda);

    iamRoles.mediaInfo.addToPolicy(policyStatements.mediaInfoRoleLogs);

    iamRoles.mediaInfo.addToPolicy(policyStatements.mediaInfoRoleS3);

    iamRoles.mediaPackageAsset.addToPolicy(
      policyStatements.mediaPackageAssetRoleIam
    );

    iamRoles.mediaPackageAsset.addToPolicy(
      policyStatements.mediaPackageAssetRoleLambda
    );

    iamRoles.mediaPackageAsset.addToPolicy(
      policyStatements.mediaPackageAssetRoleLogs
    );

    iamRoles.mediaPackageAsset.addToPolicy(
      policyStatements.mediaPackageAssetRoleMediaPackage
    );

    iamRoles.mediaPackageVod.addToPolicy(
      policyStatements.mediaPackageVodRoleS3PolicyStatement
    );

    iamRoles.outputValidate.addToPolicy(
      policyStatements.outputValidateRoleDynamoDb
    );

    iamRoles.outputValidate.addToPolicy(
      policyStatements.outputValidateRoleLambda
    );

    iamRoles.outputValidate.addToPolicy(
      policyStatements.outputValidateRoleLogs
    );

    iamRoles.outputValidate.addToPolicy(policyStatements.outputValidateRoleS3);

    iamRoles.profiler.addToPolicy(policyStatements.profilerRoleDynamoDb);

    iamRoles.profiler.addToPolicy(policyStatements.profilerRoleLambda);

    iamRoles.profiler.addToPolicy(policyStatements.profilerRoleLogs);

    iamRoles.snsNotification.addToPolicy(
      policyStatements.snsNotificationRoleLambda
    );

    iamRoles.snsNotification.addToPolicy(
      policyStatements.snsNotificationRoleLogs
    );

    iamRoles.snsNotification.addToPolicy(
      policyStatements.snsNotificationRoleSns
    );

    iamRoles.sqsSendMessage.addToPolicy(
      policyStatements.sqsSendMessageRoleLambda
    );

    iamRoles.sqsSendMessage.addToPolicy(
      policyStatements.sqsSendMessageRoleLogs
    );

    iamRoles.sqsSendMessage.addToPolicy(policyStatements.sqsSendMessageRoleSqs);

    iamRoles.stepFunctions.addToPolicy(
      policyStatements.stepFunctionsRoleLambda
    );

    iamRoles.stepFunctions.addToPolicy(policyStatements.stepFunctionsRoleLogs);

    iamRoles.stepFunctions.addToPolicy(
      policyStatements.stepFunctionsRoleStates
    );

    iamRoles.stepFunctionsService.addToPolicy(
      policyStatements.stepFunctionServiceRoleLambda
    );
  }
}
