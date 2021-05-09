import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IamRoles } from './iam-roles';
import { Permissions } from './permissions';
import { PolicyDocuments } from './policyDocuments';
import { PolicyStatements } from './policyStatements';

export class AwsVodCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const stackStage =
      this.node.tryGetContext('stackStage') !== undefined
        ? `${this.node.tryGetContext('stackStage')}-`
        : '';

    const stackName =
      this.node.tryGetContext('stackName') !== undefined
        ? `${this.node.tryGetContext('stackName')}-`
        : '';

    // Initialize Custom Constructs
    const iamRoles = new IamRoles(this, 'IamRoles', {
      stackStage: stackStage,
      stackName: stackName,
    });

    const permissions = new Permissions(this, 'Permissions', {
      stackStage: stackStage,
      stackName: stackName,
    });

    const policyDocuments = new PolicyDocuments(this, 'PolicyDocuments', {
      stackStage: stackStage,
      stackName: stackName,
    });

    const policyStatements = new PolicyStatements(this, 'PolicyStatements', {
      stackStage: stackStage,
      stackName: stackName,
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

    iamRoles.mediaConvertRole.addToPolicy(
      policyStatements.mediaConvertRoleS3PolicyStatement
    );

    iamRoles.mediaPackageVodRole.addToPolicy(
      policyStatements.mediaPackageVodRoleS3PolicyStatement
    );

    iamRoles.stepFunctionsServiceRole.addToPolicy(
      policyStatements.stepFunctionServiceRoleLambdaPolicyStatement
    );
  }
}
