import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';

export interface IamRolesProps {
  stackName: string;
  stackStage: string;
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
      roleName: `${props.stackStage}${props.stackName}ArchiveSourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.customResource = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackStage}${props.stackName}CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.dynamoDbUpdate = new iam.Role(this, 'DynamoUpdateRole', {
      roleName: `${props.stackStage}${props.stackName}DynamoUpdateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.encode = new iam.Role(this, 'EncodeRole', {
      roleName: `${props.stackStage}${props.stackName}EncodeRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.encode = new iam.Role(this, 'ErrorHandlerRole', {
      roleName: `${props.stackStage}${props.stackName}ErrorHandlerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.inputValidate = new iam.Role(this, 'InputValidateRole', {
      roleName: `${props.stackStage}${props.stackName}InputValidateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.mediaConvert = new iam.Role(this, 'MediaConvertRole', {
      roleName: `${props.stackStage}${props.stackName}MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal(`mediaconvert.amazonaws.com`),
    });

    this.mediaInfo = new iam.Role(this, 'MediaInfoRole', {
      roleName: `${props.stackStage}${props.stackName}MediaInfoRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaPackageAsset = new iam.Role(this, 'MediaPackageAssetRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageAssetRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaPackageVod = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
    });

    this.outputValidate = new iam.Role(this, 'OutputValidateRole', {
      roleName: `${props.stackStage}${props.stackName}OutputValidateRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.profiler = new iam.Role(this, 'ProfilerRole', {
      roleName: `${props.stackStage}${props.stackName}ProfilerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.snsNotification = new iam.Role(this, 'SnsNotificationRole', {
      roleName: `${props.stackStage}${props.stackName}SnsNotificationRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.sqsSendMessage = new iam.Role(this, 'SqsSendMessageRole', {
      roleName: `${props.stackStage}${props.stackName}SqsSendMessageRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.stepFunctions = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `${props.stackStage}${props.stackName}StepFunctionsRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.stepFunctionsService = new iam.Role(this, 'StepFunctionsServiceRole', {
      roleName: `${props.stackStage}${props.stackName}StepFunctionsServiceRole`,
      assumedBy: new iam.ServicePrincipal(
        `states.${Stack.of(this).region}.amazonaws.com`
      ),
    });
  }
}
