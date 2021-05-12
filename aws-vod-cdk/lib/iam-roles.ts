import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';

export interface IamRolesProps {
  stackName: string;
  stackStage: string;
}

export class IamRoles extends Construct {
  public readonly customResourceRole: iam.Role;
  public readonly dynamoDbUpdateRole: iam.Role;
  public readonly inputValidateRole: iam.Role;
  public readonly mediaConvertRole: iam.Role;
  public readonly mediaInfoRole: iam.Role;
  public readonly mediaPackageVodRole: iam.Role;
  public readonly profilerRole: iam.Role;
  public readonly stepFunctionsRole: iam.Role;
  public readonly stepFunctionsServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    this.customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackStage}${props.stackName}CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.dynamoDbUpdateRole = new iam.Role(this, 'DynamoUpdateRole', {
      roleName: `${props.stackStage}${props.stackName}DynamoUpdateRole`,
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

    this.mediaPackageVodRole = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
    });

    this.profilerRole = new iam.Role(this, 'ProfilerRole', {
      roleName: `${props.stackStage}${props.stackName}ProfilerRole`,
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
