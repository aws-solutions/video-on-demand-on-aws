import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';

export interface IamRolesProps {
  stackName: string;
  stackStage: string;
}

export class IamRoles extends Construct {
  public readonly archiveSourceRole: iam.Role;
  public readonly customResourceRole: iam.Role;
  public readonly dynamoDbUpdateRole: iam.Role;
  public readonly encodeRole: iam.Role;
  public readonly errorHandlerRole: iam.Role;
  public readonly inputValidateRole: iam.Role;
  public readonly mediaConvertRole: iam.Role;
  public readonly mediaInfoRole: iam.Role;
  public readonly mediaPackageAssetRole: iam.Role;
  public readonly mediaPackageVodRole: iam.Role;
  public readonly outputValidateRole: iam.Role;
  public readonly profilerRole: iam.Role;
  public readonly snsNotificationRole: iam.Role;
  public readonly sqsSendMessageRole: iam.Role;
  public readonly stepFunctionsRole: iam.Role;
  public readonly stepFunctionsServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    this.archiveSourceRole = new iam.Role(this, 'ArchiveSourceRole', {
      roleName: `${props.stackStage}${props.stackName}ArchiveSourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackStage}${props.stackName}CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.dynamoDbUpdateRole = new iam.Role(this, 'DynamoUpdateRole', {
      roleName: `${props.stackStage}${props.stackName}DynamoUpdateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.encodeRole = new iam.Role(this, 'EncodeRole', {
      roleName: `${props.stackStage}${props.stackName}EncodeRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.encodeRole = new iam.Role(this, 'ErrorHandlerRole', {
      roleName: `${props.stackStage}${props.stackName}ErrorHandlerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.inputValidateRole = new iam.Role(this, 'InputValidateRole', {
      roleName: `${props.stackStage}${props.stackName}InputValidateRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      roleName: `${props.stackStage}${props.stackName}MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal(`mediaconvert.amazonaws.com`),
    });

    this.mediaInfoRole = new iam.Role(this, 'MediaInfoRole', {
      roleName: `${props.stackStage}${props.stackName}MediaInfoRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaPackageAssetRole = new iam.Role(this, 'MediaPackageAssetRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageAssetRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.mediaPackageVodRole = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
    });

    this.outputValidateRole = new iam.Role(this, 'OutputValidateRole', {
      roleName: `${props.stackStage}${props.stackName}OutputValidateRole`,
      assumedBy: new iam.ServicePrincipal(`lambda.amazonaws.com`),
    });

    this.profilerRole = new iam.Role(this, 'ProfilerRole', {
      roleName: `${props.stackStage}${props.stackName}ProfilerRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.snsNotificationRole = new iam.Role(this, 'SnsNotificationRole', {
      roleName: `${props.stackStage}${props.stackName}SnsNotificationRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.sqsSendMessageRole = new iam.Role(this, 'SqsSendMessageRole', {
      roleName: `${props.stackStage}${props.stackName}SqsSendMessageRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      roleName: `${props.stackStage}${props.stackName}StepFunctionsRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.stepFunctionsServiceRole = new iam.Role(
      this,
      'StepFunctionsServiceRole',
      {
        roleName: `${props.stackStage}${props.stackName}StepFunctionsServiceRole`,
        assumedBy: new iam.ServicePrincipal(
          `states.${Stack.of(this).region}.amazonaws.com`
        ),
      }
    );
  }
}
