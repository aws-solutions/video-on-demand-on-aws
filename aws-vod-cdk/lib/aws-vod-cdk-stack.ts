import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ContextVariables } from './_context-variables';
import { CloudFronts } from './cloudfronts';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';
import { DynamoDbTables } from './dynamodb-tables';
import { EventPatterns } from './event-patterns';
import { IamRoles } from './iam-roles';
import { KmsKeys } from './kms-keys';
import { LambdaFunctions } from './lambda-functions';
import { LambdaPermissions } from './lambda-permissions';
import { PolicyStatements } from './policy-statements';
import { Rules } from './rules';
import { S3Buckets } from './s3-buckets';
import { SnsTopics } from './sns-topics';
import { SqsQueues } from './sqs-queues';
import { StepFunctions } from './step-functions';
import { StepFunctionsChoices } from './step-functions-choices';
import { StepFunctionsPasses } from './step-functions-passes';
import { StepFunctionsTasks } from './step-functions-tasks';
import { CustomResources } from './custom-resources';
import { Outputs } from './outputs';
import { PolicyDocuments } from './policy-documents';

export class AwsVodCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Set constant values from the Stack
    const account = this.account;
    const partition = this.partition;
    const region = this.region;
    const stackName = this.stackName;

    // Import Context Variables
    const contextVariables = new ContextVariables(this);

    // Initialize Custom Constructs
    const cloudfrontOriginAccessIdentities =
      new CloudfrontOriginAccessIdentities(
        this,
        'CloudFrontOriginAccessIdentities',
        {
          stackName: stackName,
        }
      );

    const dynamoDbTables = new DynamoDbTables(this, 'DynamoDbTables', {
      stackName: stackName,
    });

    const eventPatterns = new EventPatterns(this, 'EventPatterns', {
      stackName: stackName,
    });

    const kmsKeys = new KmsKeys(this, 'KmsKeys', {
      stackName: stackName,
    });

    const lambdaPermissions = new LambdaPermissions(this, 'Permissions', {
      stackName: stackName,
    });

    const s3Buckets = new S3Buckets(this, 'S3Buckets', {
      stackName: stackName,
    });

    const snsTopics = new SnsTopics(this, 'SnsTopics', {
      adminEmail: contextVariables.adminEmail,
      kmsKeys: kmsKeys,
      stackName: stackName,
    });

    const sqsQueues = new SqsQueues(this, 'SqsQueues', {
      kmsKeys: kmsKeys,
      stackName: stackName,
    });

    const cloudFronts = new CloudFronts(this, 'CloudFronts', {
      cloudFrontDomain: contextVariables.cloudFrontDomain,
      cloudfrontOriginAccessIdentities: cloudfrontOriginAccessIdentities,
      hostedZoneId: contextVariables.hostedZoneId,
      region: region,
      s3Buckets: s3Buckets,
      stackName: stackName,
    });

    const policyStatements = new PolicyStatements(this, 'PolicyStatements', {
      account: account,
      cloudFronts: cloudFronts,
      cloudfrontOriginAccessIdentities: cloudfrontOriginAccessIdentities,
      dynamoDbTables: dynamoDbTables,
      kmsKeys: kmsKeys,
      partition: partition,
      region: region,
      s3Buckets: s3Buckets,
      snsTopics: snsTopics,
      sqsQueues: sqsQueues,
      stackName: stackName,
    });

    const policyDocuments = new PolicyDocuments(this, 'PolicyDocuments', {
      policyStatements: policyStatements,
      stackName: stackName,
    });

    const iamRoles = new IamRoles(this, 'IamRoles', {
      policyDocuments: policyDocuments,
      policyStatements: policyStatements,
      stackName: stackName,
    });

    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      acceleratedTranscoding: contextVariables.acceleratedTranscoding,
      account: account,
      cloudFronts: cloudFronts,
      dynamoDbTables: dynamoDbTables,
      enableMediaPackage: contextVariables.enableMediaPackage,
      enableSns: contextVariables.enableSns,
      enableSqs: contextVariables.enableSqs,
      frameCapture: contextVariables.frameCapture,
      glacier: contextVariables.glacier,
      iamRoles: iamRoles,
      lambdaPermissions: lambdaPermissions,
      partition: partition,
      region: region,
      s3Buckets: s3Buckets,
      snsTopics: snsTopics,
      sqsQueues: sqsQueues,
      stackName: stackName,
    });

    const rules = new Rules(this, 'Rules', {
      eventPatterns: eventPatterns,
      lambdaFunctions: lambdaFunctions,
      stackName: stackName,
    });

    const customResources = new CustomResources(this, 'CustomResources', {
      cloudFronts: cloudFronts,
      enableMediaPackage: contextVariables.enableMediaPackage,
      frameCapture: contextVariables.frameCapture,
      glacier: contextVariables.glacier,
      lambdaFunctions: lambdaFunctions,
      s3Buckets: s3Buckets,
      sendAnonymousMetrics: contextVariables.sendAnonymousMetrics,
      stackName: stackName,
      workflowTrigger: contextVariables.workflowTrigger,
    });

    const outputs = new Outputs(this, 'Outputs', {
      cloudFronts: cloudFronts,
      customResources: customResources,
      dynamoDbTables: dynamoDbTables,
      s3Buckets: s3Buckets,
      snsTopics: snsTopics,
      sqsQueues: sqsQueues,
      stackName: stackName,
    });

    const stepFunctionsChoices = new StepFunctionsChoices(
      this,
      'StepFunctionsChoices',
      {
        stackName: stackName,
      }
    );

    const stepFunctionsPasses = new StepFunctionsPasses(
      this,
      'StepFunctionsPasses',
      {
        stackName: stackName,
      }
    );

    const stepFunctionsTasks = new StepFunctionsTasks(
      this,
      'StepFunctionsTasks',
      {
        lambdaFunctions: lambdaFunctions,
        stackName: stackName,
      }
    );

    const stepFunctions = new StepFunctions(this, 'StepFunctions', {
      iamRoles: iamRoles,
      stackName: stackName,
      stepFunctionsChoices: stepFunctionsChoices,
      stepFunctionsPasses: stepFunctionsPasses,
      stepFunctionsTasks: stepFunctionsTasks,
    });

    // Add IamRoles to PolicyStatements as resources
    // This must be done here to prevent circular dependency issues
    policyStatements.encodeRoleIam.addResources(iamRoles.mediaConvert.roleArn);

    policyStatements.mediaPackageAssetRoleIam.addResources(
      iamRoles.mediaPackageVod.roleArn
    );

    // Associate destinationBucket PolicyStatement with destination S3Bucket
    // This must be done here to prevent circular dependency issues
    s3Buckets.destination.addToResourcePolicy(
      policyStatements.destinationBucket
    );

    // Add environment variables to LambdaFunctions
    // This must be done here to prevent circular dependency issues
    lambdaFunctions.encode.addEnvironment(
      'EndPoint',
      customResources.mediaConvertEndPoint.getAttString('EndpointUrl')
    );

    lambdaFunctions.outputValidate.addEnvironment(
      'EndPoint',
      customResources.mediaConvertEndPoint.getAttString('EndpointUrl')
    );

    lambdaFunctions.mediaPackageAssets.addEnvironment(
      'GroupId',
      customResources.mediaPackageVod.getAttString('GroupId')
    );
    lambdaFunctions.mediaPackageAssets.addEnvironment(
      'GroupDomainName',
      customResources.mediaPackageVod.getAttString('GroupDomainName')
    );
  }
}
