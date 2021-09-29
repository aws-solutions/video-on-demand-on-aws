import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';
import { PolicyStatements } from './policy-statements';

export interface PolicyDocumentsProps {
  policyStatements: PolicyStatements;
  stackName: string;
}

export class PolicyDocuments extends Construct {
  public readonly appSync: iam.PolicyDocument;
  public readonly appsyncReadOnly: iam.PolicyDocument;
  public readonly archiveSource: iam.PolicyDocument;
  public readonly cognitoPostConfirmationTrigger: iam.PolicyDocument;
  public readonly customResource: iam.PolicyDocument;
  public readonly destinationBucket: iam.PolicyDocument;
  public readonly dynamoDbUpdate: iam.PolicyDocument;
  public readonly encode: iam.PolicyDocument;
  public readonly errorHandler: iam.PolicyDocument;
  public readonly inputValidate: iam.PolicyDocument;
  public readonly mediaConvert: iam.PolicyDocument;
  public readonly mediaInfo: iam.PolicyDocument;
  public readonly mediaPackageAssets: iam.PolicyDocument;
  public readonly mediaPackageVod: iam.PolicyDocument;
  public readonly outputValidate: iam.PolicyDocument;
  public readonly profiler: iam.PolicyDocument;
  public readonly snsNotification: iam.PolicyDocument;
  public readonly sqsSendMessage: iam.PolicyDocument;
  public readonly stepFunctions: iam.PolicyDocument;
  public readonly stepFunctionsService: iam.PolicyDocument;

  constructor(scope: Construct, id: string, props: PolicyDocumentsProps) {
    super(scope, id);

    this.appSync = new iam.PolicyDocument({
      statements: [props.policyStatements.appSyncRoleDynamoDb],
    });

    this.appsyncReadOnly = new iam.PolicyDocument({
      statements: [props.policyStatements.appSyncRoleReadOnly],
    });

    this.archiveSource = new iam.PolicyDocument({
      statements: [
        props.policyStatements.archiveSourceRoleLambda,
        props.policyStatements.archiveSourceRoleLogs,
        props.policyStatements.archiveSourceRoleS3,
      ],
    });

    this.cognitoPostConfirmationTrigger = new iam.PolicyDocument({
      statements: [props.policyStatements.cognitoPostConfirmationTrigger],
    });

    this.customResource = new iam.PolicyDocument({
      statements: [
        props.policyStatements.customResourceRoleCloudFront,
        props.policyStatements.customResourceRoleLogs,
        props.policyStatements.customResourceRoleMediaConvert,
        props.policyStatements.customResourceRoleMediaPackageCreateList,
        props.policyStatements.customResourceRoleMediaPackageDelete,
        props.policyStatements.customResourceRoleMediaPackageDescribeDelete,
        props.policyStatements.customResourceRoleS3,
      ],
    });

    this.destinationBucket = new iam.PolicyDocument({
      statements: [props.policyStatements.destinationBucket],
    });

    this.dynamoDbUpdate = new iam.PolicyDocument({
      statements: [
        props.policyStatements.dynamoDbUpdateRoleDynamoDb,
        props.policyStatements.dynamoDbUpdateRoleLambda,
        props.policyStatements.dynamoDbUpdateRoleLogs,
      ],
    });

    this.encode = new iam.PolicyDocument({
      statements: [
        props.policyStatements.encodeRoleIam,
        props.policyStatements.encodeRoleLambda,
        props.policyStatements.encodeRoleLogs,
        props.policyStatements.encodeRoleMediaConvert,
        props.policyStatements.encodeRoleS3GetObject,
        props.policyStatements.encodeRoleS3PutObject,
      ],
    });

    this.errorHandler = new iam.PolicyDocument({
      statements: [
        props.policyStatements.errorHandlerRoleDynamoDb,
        props.policyStatements.errorHandlerRoleLogs,
        props.policyStatements.errorHandlerRoleSns,
      ],
    });

    this.inputValidate = new iam.PolicyDocument({
      statements: [
        props.policyStatements.inputValidateRoleLambda,
        props.policyStatements.inputValidateRoleLogs,
        props.policyStatements.inputValidateRoleS3,
      ],
    });

    this.mediaConvert = new iam.PolicyDocument({
      statements: [
        props.policyStatements.mediaConvertRoleExecuteApi,
        props.policyStatements.mediaConvertRoleS3,
      ],
    });

    this.mediaInfo = new iam.PolicyDocument({
      statements: [
        props.policyStatements.mediaInfoRoleLambda,
        props.policyStatements.mediaInfoRoleLogs,
        props.policyStatements.mediaInfoRoleS3,
      ],
    });

    this.mediaPackageAssets = new iam.PolicyDocument({
      statements: [
        props.policyStatements.mediaPackageAssetRoleIam,
        props.policyStatements.mediaPackageAssetRoleLambda,
        props.policyStatements.mediaPackageAssetRoleLogs,
        props.policyStatements.mediaPackageAssetRoleMediaPackage,
      ],
    });

    this.mediaPackageVod = new iam.PolicyDocument({
      statements: [props.policyStatements.mediaPackageVodRoleS3],
    });

    this.outputValidate = new iam.PolicyDocument({
      statements: [
        props.policyStatements.outputValidateRoleDynamoDb,
        props.policyStatements.outputValidateRoleLambda,
        props.policyStatements.outputValidateRoleLogs,
        props.policyStatements.outputValidateRoleS3,
      ],
    });

    this.profiler = new iam.PolicyDocument({
      statements: [
        props.policyStatements.profilerRoleDynamoDb,
        props.policyStatements.profilerRoleLambda,
        props.policyStatements.profilerRoleLogs,
      ],
    });

    this.snsNotification = new iam.PolicyDocument({
      statements: [
        props.policyStatements.snsNotificationRoleKms,
        props.policyStatements.snsNotificationRoleLambda,
        props.policyStatements.snsNotificationRoleLogs,
        props.policyStatements.snsNotificationRoleSns,
      ],
    });

    this.sqsSendMessage = new iam.PolicyDocument({
      statements: [
        props.policyStatements.sqsSendMessageRoleKms,
        props.policyStatements.sqsSendMessageRoleLambda,
        props.policyStatements.sqsSendMessageRoleLogs,
        props.policyStatements.sqsSendMessageRoleSqs,
      ],
    });

    this.stepFunctions = new iam.PolicyDocument({
      statements: [
        props.policyStatements.stepFunctionsRoleLambda,
        props.policyStatements.stepFunctionsRoleLogs,
        props.policyStatements.stepFunctionsRoleStates,
      ],
    });

    this.stepFunctionsService = new iam.PolicyDocument({
      statements: [props.policyStatements.stepFunctionServiceRoleLambda],
    });
  }
}
