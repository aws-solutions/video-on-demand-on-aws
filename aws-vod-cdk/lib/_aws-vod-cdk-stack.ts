import {
  aws_cognito as cognito,
  aws_lambda as lambda,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { AppSyncs } from './appsyncs';
import { Construct } from 'constructs';
import { CertificateManagers } from './certificate-managers';
import { ContextVariables } from './_context-variables';
import { CloudFronts } from './cloudfronts';
import { CloudfrontOriginAccessIdentities } from './cloudfront-origin-access-identities';
import { Cognitos } from './cognitos';
import { DynamoDbTables } from './dynamodb-tables';
import { EventPatterns } from './event-patterns';
import { IamRoles } from './iam-roles';
import { KmsKeys } from './kms-keys';
import { LambdaFunctions } from './lambda-functions';
import { LambdaPermissions } from './lambda-permissions';
import { Outputs } from './outputs';
import { PolicyDocuments } from './policy-documents';
import { PolicyStatements } from './policy-statements';
import { Route53s } from './route53s';
import { Rules } from './rules';
import { S3Buckets } from './s3-buckets';
import { SnsTopics } from './sns-topics';
import { SqsQueues } from './sqs-queues';
import { StepFunctions } from './step-functions';
import { StepFunctionsChoices } from './step-functions-choices';
import { StepFunctionsPasses } from './step-functions-passes';
import { StepFunctionsTasks } from './step-functions-tasks';
import { CustomResources } from './custom-resources';
import { UserPoolGroups } from './user-pool-groups';
import { Wafs } from './wafs';

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

    const route53s = new Route53s(this, 'Route53s', {
      cloudFrontDomainBase: contextVariables.cloudFrontDomainBase,
      hostedZoneId: contextVariables.hostedZoneId,
    });

    const certificateManagers = new CertificateManagers(
      this,
      'CertificateManagers',
      {
        authenticationDomain: contextVariables.authenticationDomain,
        authenticationSubDomain: contextVariables.authenticationSubDomain,
        cloudFrontDomainBase: contextVariables.cloudFrontDomainBase,
        hostedZoneId: contextVariables.hostedZoneId,
        route53s: route53s,
        videosDomain: contextVariables.videosDomain,
      }
    );

    const cloudFronts = new CloudFronts(this, 'CloudFronts', {
      certificateManagers: certificateManagers,
      videosDomain: contextVariables.videosDomain,
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

    const cognitos = new Cognitos(this, 'Cognitos', {
      authenticationDomain: contextVariables.authenticationDomain,
      authenticationSubDomain: contextVariables.authenticationSubDomain,
      certificateManagers: certificateManagers,
      cloudFrontDomainBase: contextVariables.cloudFrontDomainBase,
      hostedZoneId: contextVariables.hostedZoneId,
      prependDomainWithStackStage: contextVariables.prependDomainWithStackStage,
      route53s: route53s,
      stackName: stackName,
      stackStage: contextVariables.stackStage,
    });

    const iamRoles = new IamRoles(this, 'IamRoles', {
      cognitos: cognitos,
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

    // Cognitos was here

    const appsyncs = new AppSyncs(this, 'AppSyncs', {
      cognitos: cognitos,
      dynamoDbTables: dynamoDbTables,
      iamRoles: iamRoles,
      region: region,
      stackName: stackName,
    });

    const wafs = new Wafs(this, 'Wafs', {
      appsyncs: appsyncs,
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

    const userPoolGroups = new UserPoolGroups(this, 'UserPoolGroups', {
      cognitos: cognitos,
      iamRoles: iamRoles,
    });

    // Add cognito Post Confirmation Trigger
    cognitos.userPool.addTrigger(
      cognito.UserPoolOperation.POST_CONFIRMATION,
      lambdaFunctions.cognitoPostConfirmationTrigger
    );

    // Add UserPool to PolicyStatements as resources
    // This must be done here to prevent circular dependency issues
    policyStatements.cognitoPostConfirmationTrigger.addResources(
      `${cognitos.userPool.userPoolArn}`
    );

    // Add GraphQL to PolicyStatements as resources
    // This must be done here to prevent circular dependency issues
    policyStatements.appSyncRoleReadOnly.addResources(
      `${appsyncs.videoApi.attrArn}/*`
    );

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
