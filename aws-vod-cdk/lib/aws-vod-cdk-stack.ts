import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
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

// Create an extension method to allow easy conversion to boolean
// values from 'yes', 1, 'true', etc.
Object.defineProperty(String.prototype, 'toBool', {
  value: function toBool() {
    switch (this) {
      case true:
      case 'true':
      case 1:
      case '1':
      case 'on':
      case 'yes':
        return true;
      default:
        return false;
    }
  },
  writable: true,
  configurable: true,
});

export class AwsVodCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Attempt to set constant variables from context;
    // set default values (empty string) if not found
    const account = this.account;
    const partition = this.partition;
    const region = this.region;
    const stackName = this.stackName;

    const adminEmail =
      this.node.tryGetContext('adminEmail') !== undefined
        ? this.node.tryGetContext('adminEmail')
        : '';

    const workflowTrigger =
      this.node.tryGetContext('workflowTrigger') !== undefined
        ? this.node.tryGetContext('workflowTrigger')
        : 'VideoFile';

    const glacier =
      this.node.tryGetContext('glacier') !== undefined
        ? this.node.tryGetContext('glacier')
        : 'DISABLED';

    const frameCapture =
      this.node.tryGetContext('frameCapture') !== undefined
        ? this.node.tryGetContext('frameCapture').toBool()
        : false;

    const enableMediaPackage =
      this.node.tryGetContext('enableMediaPackage') !== undefined
        ? this.node.tryGetContext('enableMediaPackage').toBool()
        : false;

    const enableSns =
      this.node.tryGetContext('enableSns') !== undefined
        ? this.node.tryGetContext('enableSns').toBool()
        : true;

    const enableSqs =
      this.node.tryGetContext('enableSqs') !== undefined
        ? this.node.tryGetContext('enableSqs').toBool()
        : true;

    const acceleratedTranscoding =
      this.node.tryGetContext('acceleratedTranscoding') !== undefined
        ? this.node.tryGetContext('acceleratedTranscoding')
        : 'PREFERRED';

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
      kmsKeys: kmsKeys,
      stackName: stackName,
    });

    const sqsQueues = new SqsQueues(this, 'SqsQueues', {
      kmsKeys: kmsKeys,
      stackName: stackName,
    });

    const stepFunctions = new StepFunctions(this, 'StepFunctions', {
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
        stackName: stackName,
      }
    );

    const cloudFronts = new CloudFronts(this, 'CloudFronts', {
      cloudfrontOriginAccessIdentities: cloudfrontOriginAccessIdentities,
      region: region,
      s3Buckets: s3Buckets,
      stackName: stackName,
    });

    const policyStatements = new PolicyStatements(this, 'PolicyStatements', {
      account: account,
      cloudFronts: cloudFronts,
      cloudfrontOriginAccessIdentities: cloudfrontOriginAccessIdentities,
      partition: partition,
      region: region,
      s3Buckets: s3Buckets,
      stackName: stackName,
    });

    const iamRoles = new IamRoles(this, 'IamRoles', {
      policyStatements: policyStatements,
      stackName: stackName,
    });

    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      acceleratedTranscoding: acceleratedTranscoding,
      cloudFronts: cloudFronts,
      enableMediaPackage: enableMediaPackage,
      enableSns: enableSns,
      enableSqs: enableSqs,
      frameCapture: frameCapture,
      glacier: glacier,
      iamRoles: iamRoles,
      lambdaPermissions: lambdaPermissions,
      s3Buckets: s3Buckets,
      stackName: stackName,
    });

    const rules = new Rules(this, 'Rules', {
      eventPatterns: eventPatterns,
      lambdaFunctions: lambdaFunctions,
      stackName: stackName,
    });

    const customResources = new CustomResources(this, 'CustomResources', {
      cloudFronts: cloudFronts,
      enableMediaPackage: enableMediaPackage,
      lambdaFunctions: lambdaFunctions,
      s3Buckets: s3Buckets,
      stackName: stackName,
      workflowTrigger: workflowTrigger,
    });

    // Associate destinationBucket PolicyStatement with destination S3Bucket
    // This must be done here to prevent circular dependency issues
    s3Buckets.destination.addToResourcePolicy(
      policyStatements.destinationBucket
    );
  }
}
