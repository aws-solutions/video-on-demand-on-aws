import { Construct } from 'constructs';
import { Stack, aws_iam as iam } from 'aws-cdk-lib';

export interface IamRolesProps {
  stackStage: string;
  stackName: string;
}

export class IamRoles extends Construct {
  public readonly customResourceRole: iam.Role;
  public readonly stepFunctionsServiceRole: iam.Role;
  public readonly mediaConvertRole: iam.Role;
  public readonly mediaPackageVodRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    this.customResourceRole = new iam.Role(this, 'CustomResourceRole', {
      roleName: `${props.stackStage}${props.stackName}CustomResourceRole`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    this.mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      roleName: `${props.stackStage}${props.stackName}MediaConvertRole`,
      assumedBy: new iam.ServicePrincipal(`mediaconvert.amazonaws.com`),
    });

    this.mediaPackageVodRole = new iam.Role(this, 'MediaPackageVodRole', {
      roleName: `${props.stackStage}${props.stackName}MediaPackageVodRole`,
      assumedBy: new iam.ServicePrincipal(`mediapackage.amazonaws.com`),
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
