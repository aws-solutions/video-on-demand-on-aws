import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';
import { PolicyStatements } from './policy-statements';

export interface IamRolesProps {
  policyStatements: PolicyStatements;
  stackName: string;
}

export class IamRoles extends Construct {
  public readonly archiveSource: iam.Role;
  public readonly customResource: iam.Role;
  public readonly dynamoDbUpdate: iam.Role;
  public readonly encode: iam.Role;
  public readonly errorHandler: iam.Role;
  public readonly inputValidate: iam.Role;
  public readonly mediaConvert: iam.Role;
  public readonly mediaInfo: iam.Role;
  public readonly mediaPackageAsset: iam.Role;
  public readonly mediaPackageVod: iam.Role;
  public readonly outputValidate: iam.Role;
  public readonly profiler: iam.Role;
  public readonly snsNotification: iam.Role;
  public readonly sqsSendMessage: iam.Role;
  public readonly stepFunctions: iam.Role;
  public readonly stepFunctionsService: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    this.archiveSource = new iam.Role(this, 'ArchiveSourceRole', {
      roleName: `${props.stackName}-ArchiveSourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.archiveSource.addToPolicy(
      props.policyStatements.archiveSourceRoleLambda
    );

    this.archiveSource.addToPolicy(
      props.policyStatements.archiveSourceRoleLogs
    );

    this.archiveSource.addToPolicy(props.policyStatements.archiveSourceRoleS3);

    this.customResource = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackName}-CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleCloudFront
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleLogs
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleMediaConvert
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleMediaPackageCreateList
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleMediaPackageDelete
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleMediaPackageDescribeDelete
    );

    this.customResource.addToPolicy(
      props.policyStatements.customResourceRoleS3
    );

    this.dynamoDbUpdate = new iam.Role(this, 'DynamoUpdateRole', {
      roleName: `${props.stackName}-DynamoUpdateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.dynamoDbUpdate.addToPolicy(
      props.policyStatements.dynamoDbUpdateRoleLambda
    );

    this.dynamoDbUpdate.addToPolicy(
      props.policyStatements.dynamoDbUpdateRoleLogs
    );

    this.dynamoDbUpdate.addToPolicy(
      props.policyStatements.dynamoDbUpdateRoleS3
    );

    this.encode = new iam.Role(this, 'EncodeRole', {
      roleName: `${props.stackName}-EncodeRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.encode.addToPolicy(props.policyStatements.encodeRoleIam);

    this.encode.addToPolicy(props.policyStatements.encodeRoleLambda);

    this.encode.addToPolicy(props.policyStatements.encodeRoleLogs);

    this.encode.addToPolicy(props.policyStatements.encodeRoleMediaConvert);

    this.encode.addToPolicy(props.policyStatements.encodeRoleS3GetObject);

    this.encode.addToPolicy(props.policyStatements.encodeRoleS3PutObject);

    this.errorHandler = new iam.Role(this, 'ErrorHandlerRole', {
      roleName: `${props.stackName}-ErrorHandlerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.errorHandler.addToPolicy(
      props.policyStatements.errorHandlerRoleDynamoDb
    );

    this.errorHandler.addToPolicy(props.policyStatements.errorHandlerRoleLogs);

    this.errorHandler.addToPolicy(props.policyStatements.errorHandlerRoleSns);

    this.inputValidate = new iam.Role(this, 'InputValidateRole', {
      roleName: `${props.stackName}-InputValidateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.inputValidate.addToPolicy(
      props.policyStatements.inputValidateRoleLambda
    );

    this.inputValidate.addToPolicy(
      props.policyStatements.inputValidateRoleLogs
    );

    this.inputValidate.addToPolicy(props.policyStatements.inputValidateRoleS3);

    this.mediaConvert = new iam.Role(this, 'MediaConvertRole', {
      roleName: `${props.stackName}-MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal(`mediaconvert.amazonaws.com`),
    });

    this.mediaConvert.addToPolicy(props.policyStatements.mediaConvertRoleS3);

    this.mediaInfo = new iam.Role(this, 'MediaInfoRole', {
      roleName: `${props.stackName}-MediaInfoRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaInfo.addToPolicy(props.policyStatements.mediaInfoRoleLambda);

    this.mediaInfo.addToPolicy(props.policyStatements.mediaInfoRoleLogs);

    this.mediaInfo.addToPolicy(props.policyStatements.mediaInfoRoleS3);

    this.mediaPackageAsset = new iam.Role(this, 'MediaPackageAssetRole', {
      roleName: `${props.stackName}-MediaPackageAssetRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaPackageAsset.addToPolicy(
      props.policyStatements.mediaPackageAssetRoleIam
    );

    this.mediaPackageAsset.addToPolicy(
      props.policyStatements.mediaPackageAssetRoleLambda
    );

    this.mediaPackageAsset.addToPolicy(
      props.policyStatements.mediaPackageAssetRoleLogs
    );

    this.mediaPackageAsset.addToPolicy(
      props.policyStatements.mediaPackageAssetRoleMediaPackage
    );

    this.mediaPackageVod = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackName}-MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
    });

    this.mediaPackageVod.addToPolicy(
      props.policyStatements.mediaPackageVodRoleS3
    );

    this.outputValidate = new iam.Role(this, 'OutputValidateRole', {
      roleName: `${props.stackName}-OutputValidateRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.outputValidate.addToPolicy(
      props.policyStatements.outputValidateRoleDynamoDb
    );

    this.outputValidate.addToPolicy(
      props.policyStatements.outputValidateRoleLambda
    );

    this.outputValidate.addToPolicy(
      props.policyStatements.outputValidateRoleLogs
    );

    this.outputValidate.addToPolicy(
      props.policyStatements.outputValidateRoleS3
    );

    this.profiler = new iam.Role(this, 'ProfilerRole', {
      roleName: `${props.stackName}-ProfilerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.profiler.addToPolicy(props.policyStatements.profilerRoleDynamoDb);

    this.profiler.addToPolicy(props.policyStatements.profilerRoleLambda);

    this.profiler.addToPolicy(props.policyStatements.profilerRoleLogs);

    this.snsNotification = new iam.Role(this, 'SnsNotificationRole', {
      roleName: `${props.stackName}-SnsNotificationRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.snsNotification.addToPolicy(
      props.policyStatements.snsNotificationRoleLambda
    );

    this.snsNotification.addToPolicy(
      props.policyStatements.snsNotificationRoleLogs
    );

    this.snsNotification.addToPolicy(
      props.policyStatements.snsNotificationRoleSns
    );

    this.sqsSendMessage = new iam.Role(this, 'SqsSendMessageRole', {
      roleName: `${props.stackName}-SqsSendMessageRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.sqsSendMessage.addToPolicy(
      props.policyStatements.sqsSendMessageRoleLambda
    );

    this.sqsSendMessage.addToPolicy(
      props.policyStatements.sqsSendMessageRoleLogs
    );

    this.sqsSendMessage.addToPolicy(
      props.policyStatements.sqsSendMessageRoleSqs
    );

    this.stepFunctions = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `${props.stackName}-StepFunctionsRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.stepFunctions.addToPolicy(
      props.policyStatements.stepFunctionsRoleLambda
    );

    this.stepFunctions.addToPolicy(
      props.policyStatements.stepFunctionsRoleLogs
    );

    this.stepFunctions.addToPolicy(
      props.policyStatements.stepFunctionsRoleStates
    );

    this.stepFunctionsService = new iam.Role(this, 'StepFunctionsServiceRole', {
      roleName: `${props.stackName}-StepFunctionsServiceRole`,
      assumedBy: new iam.ServicePrincipal(
        `states.${Stack.of(this).region}.amazonaws.com`
      ),
    });

    this.stepFunctionsService.addToPolicy(
      props.policyStatements.stepFunctionServiceRoleLambda
    );
  }
}
