import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Cloudfront } from './cloudfront';
import { DynamoDbTables } from './dynamodb-tables';
import { IamRoles } from './iam-roles';
import { Permissions } from './permissions';
import { PolicyDocuments } from './policy-documents';
import { PolicyStatements } from './policy-statements';
import { Rules } from './rules';
import { S3Buckets } from './s3-buckets';
import { SnsTopics } from './sns-topics';
import { SqsQueues } from './sqs-queues';

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

    const dynamoDbTables = new DynamoDbTables(this, 'DynamoDbTables', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const iamRoles = new IamRoles(this, 'IamRoles', {
      stackName: stackName,
      stackStage: stackStage,
    });

    const permissions = new Permissions(this, 'Permissions', {
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

    // Associate Policy Statements with Policy Documents
    policyDocuments.destinationBucketPolicyDocument.addStatements(
      policyStatements.destinationBucketPolicyStatement
    );

    // Associate Policy Statements with IAM Roles
    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleCloudFrontPolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleLoggingPolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleMediaConvertPolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleMediaPackageCreateListPolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleMediaPackageDeletePolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleMediaPackageDescribeDeletePolicyStatement
    );

    iamRoles.customResourceRole.addToPolicy(
      policyStatements.customResourceRoleS3PolicyStatement
    );

    iamRoles.dynamoDbUpdateRole.addToPolicy(
      policyStatements.dynamoDbUpdateRoleLambdaPolicyStatement
    );

    iamRoles.dynamoDbUpdateRole.addToPolicy(
      policyStatements.dynamoDbUpdateRoleLogsPolicyStatement
    );

    iamRoles.dynamoDbUpdateRole.addToPolicy(
      policyStatements.dynamoDbUpdateRoleS3PolicyStatement
    );

    iamRoles.inputValidateRole.addToPolicy(
      policyStatements.inputValidateRoleLambdaPolicyStatement
    );

    iamRoles.inputValidateRole.addToPolicy(
      policyStatements.inputValidateRoleLogsPolicyStatement
    );

    iamRoles.inputValidateRole.addToPolicy(
      policyStatements.inputValidateRoleS3PolicyStatement
    );

    iamRoles.mediaConvertRole.addToPolicy(
      policyStatements.mediaConvertRoleS3PolicyStatement
    );

    iamRoles.mediaInfoRole.addToPolicy(
      policyStatements.mediaInfoRoleLambdaPolicyStatement
    );

    iamRoles.mediaInfoRole.addToPolicy(
      policyStatements.mediaInfoRoleLogsPolicyStatement
    );

    iamRoles.mediaInfoRole.addToPolicy(
      policyStatements.mediaInfoRoleS3PolicyStatement
    );

    iamRoles.mediaPackageVodRole.addToPolicy(
      policyStatements.mediaPackageVodRoleS3PolicyStatement
    );

    iamRoles.profilerRole.addToPolicy(
      policyStatements.profilerRoleDynamoDbPolicyStatement
    );

    iamRoles.profilerRole.addToPolicy(
      policyStatements.profilerRoleLambdaPolicyStatement
    );

    iamRoles.profilerRole.addToPolicy(
      policyStatements.profilerRoleLogsPolicyStatement
    );

    iamRoles.stepFunctionsRole.addToPolicy(
      policyStatements.stepFunctionsRoleLambdaPolicyStatement
    );

    iamRoles.stepFunctionsRole.addToPolicy(
      policyStatements.stepFunctionsRoleLogsPolicyStatement
    );

    iamRoles.stepFunctionsRole.addToPolicy(
      policyStatements.stepFunctionsRoleStatesPolicyStatement
    );

    iamRoles.stepFunctionsServiceRole.addToPolicy(
      policyStatements.stepFunctionServiceRoleLambdaPolicyStatement
    );
  }
}
