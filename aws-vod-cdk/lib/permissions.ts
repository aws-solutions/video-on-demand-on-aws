import { Construct } from 'constructs';
import { aws_lambda as lambda, aws_iam as iam } from 'aws-cdk-lib';

export interface PermissionsProps {
  stackName: string;
  stackStage: string;
}

export class Permissions extends Construct {
  public readonly s3LambdaInvokeVideoPermission: lambda.Permission;
  public readonly cloudwatchLambdaInvokeErrorsPermission: lambda.Permission;
  public readonly cloudwatchLambdaInvokeCompletePermission: lambda.Permission;

  constructor(scope: Construct, id: string, props: PermissionsProps) {
    super(scope, id);

    this.s3LambdaInvokeVideoPermission = {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };

    this.cloudwatchLambdaInvokeErrorsPermission = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };

    this.cloudwatchLambdaInvokeCompletePermission = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };
  }
}
