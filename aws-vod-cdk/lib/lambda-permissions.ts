import { Construct } from 'constructs';
import { aws_lambda as lambda, aws_iam as iam } from 'aws-cdk-lib';

export interface LambdaPermissionsProps {
  stackName: string;
  stackStage: string;
}

export class LambdaPermissions extends Construct {
  public readonly s3LambdaInvokeVideo: lambda.Permission;
  public readonly cloudwatchLambdaInvokeErrors: lambda.Permission;
  public readonly cloudwatchLambdaInvokeComplete: lambda.Permission;

  constructor(scope: Construct, id: string, props: LambdaPermissionsProps) {
    super(scope, id);

    this.s3LambdaInvokeVideo = {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };

    this.cloudwatchLambdaInvokeErrors = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };

    this.cloudwatchLambdaInvokeComplete = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    };
  }
}
