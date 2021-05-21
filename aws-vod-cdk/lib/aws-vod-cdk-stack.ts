import {
  Stack,
  StackProps,
  aws_events_targets as targets,
  aws_cloudfront as cloudFront,
  aws_cloudfront_origins as origins,
  CustomResource,
  CfnOutput,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
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

    const iamRoles = new IamRoles(this, 'IamRoles', {
      stackName: stackName,
    });

    const kmsKeys = new KmsKeys(this, 'KmsKeys', {
      stackName: stackName,
    });

    const lambdaFunctions = new LambdaFunctions(this, 'LambdaFunctions', {
      acceleratedTranscoding: acceleratedTranscoding,
      enableMediaPackage: enableMediaPackage,
      enableSns: enableSns,
      enableSqs: enableSqs,
      frameCapture: frameCapture,
      glacier: glacier,
      stackName: stackName,
    });

    const lambdaPermissions = new LambdaPermissions(this, 'Permissions', {
      stackName: stackName,
    });

    const policyStatements = new PolicyStatements(this, 'PolicyStatements', {
      stackName: stackName,
    });

    const rules = new Rules(this, 'Rules', {
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

    // Create CloudFront Distribution
    const cloudfrontDistribution = new cloudFront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        domainNames: [
          `${s3Buckets.destination}.s3.${this.region}.amazonaws.com`,
        ],
        defaultBehavior: {
          origin: new origins.S3Origin(s3Buckets.destination, {
            originAccessIdentity: cloudfrontOriginAccessIdentities.destination,
          }),
          allowedMethods: cloudFront.AllowedMethods.ALLOW_GET_HEAD,
          compress: true,
          viewerProtocolPolicy:
            cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudFront.CachePolicy(
            this,
            'CloudFrontDistributionCachePolicy',
            {
              cookieBehavior: cloudFront.CacheCookieBehavior.none(),
              headerBehavior: cloudFront.CacheHeaderBehavior.allowList(
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers'
              ),
              queryStringBehavior: cloudFront.CacheQueryStringBehavior.none(),
            }
          ),
        },
        priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        logBucket: s3Buckets.logs,
        logFilePrefix: 'cloudfront/',
      }
    );

    // Create custom resources
    const s3Config = new CustomResource(this, 'S3Config', {
      resourceType: 'Custom::S3',
      serviceToken: lambdaFunctions.customResource.functionArn,
      properties: [
        { Source: s3Buckets.source },
        { IngestArn: lambdaFunctions.stepFunctions.functionArn },
        { Resource: 'S3Notification' },
        { WorkflowTrigger: workflowTrigger },
      ],
    });

    const mediaConvertEndPoint = new CustomResource(
      this,
      'MediaConvertEndPoint',
      {
        resourceType: 'Custom::LoadLambda',
        serviceToken: lambdaFunctions.customResource.functionArn,
        properties: [{ Resource: 'EndPoint' }],
      }
    );

    const mediaConvertTemplates = new CustomResource(
      this,
      'MediaConvertTemplates',
      {
        resourceType: 'Custom::LoadLambda',
        serviceToken: lambdaFunctions.customResource.functionArn,
        properties: [
          { Resource: 'MediaConvertTemplates' },
          { StackName: this.stackName },
          { EndPoint: mediaConvertEndPoint.getAtt('EndpointUrl') },
          { EnableMediaPackage: enableMediaPackage },
          { EnableNewTemplates: true },
        ],
      }
    );

    const mediaPackageVod = new CustomResource(this, 'MediaPackageVod', {
      resourceType: 'Custom::LoadLambda',
      serviceToken: lambdaFunctions.customResource.functionArn,
      properties: [
        { Resource: 'MediaPackageVod' },
        { StackName: this.stackName },
        { GroupId: `${this.stackName}-packaging-group` },
        { PackagingConfigurations: 'HLS,DASH,MSS,CMAF' },
        { DistributionId: cloudFront },
        { EnableMediaPackage: enableMediaPackage },
      ],
    });

    // Add Principals to PolicyStatements (if required)
    policyStatements.destinationBucket.addCanonicalUserPrincipal(
      cloudfrontOriginAccessIdentities.destination
        .cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    // Associate Policy Statements with Specific Resources
    policyStatements.customResourceRoleCloudFront.addResources(
      `arn:${this.partition}:cloudfront::${this.account}:distribution/${cloudfrontDistribution.distributionId}`
    );

    policyStatements.customResourceRoleS3.addResources(
      s3Buckets.source.bucketArn
    );

    policyStatements.destinationBucket.addResources(
      `arn:${this.partition}:s3:::${s3Buckets.destination}/*`
    );

    policyStatements.inputValidateRoleS3.addResources(
      `${s3Buckets.source.bucketArn}/*`
    );

    policyStatements.mediaConvertRoleS3.addResources(
      `${s3Buckets.source.bucketArn}/*`,
      `${s3Buckets.destination.bucketArn}/*`
    );

    policyStatements.mediaPackageVodRoleS3.addResources(
      `${s3Buckets.destination.bucketArn}`,
      `${s3Buckets.destination.bucketArn}/*`
    );

    policyStatements.mediaInfoRoleS3.addResources(
      `${s3Buckets.source.bucketArn}/*`
    );

    // Associate destinationBucket PolicyStatement with destination S3Bucket
    s3Buckets.destination.addToResourcePolicy(
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
      policyStatements.mediaPackageVodRoleS3
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

    // Add Environment Variables to LambdaFunctions
    lambdaFunctions.inputValidate.addEnvironment(
      'Source',
      s3Buckets.source.bucketName
    );

    lambdaFunctions.inputValidate.addEnvironment(
      'Destination',
      s3Buckets.destination.bucketName
    );

    lambdaFunctions.inputValidate.addEnvironment(
      'CloudFront',
      cloudfrontDistribution.domainName
    );

    // Associate LambdaPermissions to LambdaFunctions
    lambdaFunctions.stepFunctions.addPermission(
      'S3LambdaInvokeVideo',
      lambdaPermissions.s3LambdaInvokeVideo
    );

    lambdaFunctions.errorHandler.addPermission(
      'CloudWatchLambdaInvokeErrors',
      lambdaPermissions.cloudwatchLambdaInvokeErrors
    );

    lambdaFunctions.stepFunctions.addPermission(
      'CloudWatchLambdaInvokeComplete',
      lambdaPermissions.cloudwatchLambdaInvokeComplete
    );

    // Associate EventPatterns to Rules
    rules.encodeComplete.addEventPattern(eventPatterns.encodeComplete);

    rules.encodeError.addEventPattern(eventPatterns.encodeError);

    // Associate Rules to targets
    rules.encodeComplete.addTarget(
      new targets.LambdaFunction(lambdaFunctions.stepFunctions)
    );

    rules.encodeError.addTarget(
      new targets.LambdaFunction(lambdaFunctions.errorHandler)
    );
  }
}
