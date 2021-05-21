import { Construct } from 'constructs';
import { Stack, aws_lambda as lambda, aws_iam as iam } from 'aws-cdk-lib';
import { Rules } from './rules';

export interface LambdaPermissionsProps {
  stackName: string;
}

export class LambdaPermissions extends Construct {
  public readonly s3LambdaInvokeVideo: lambda.Permission;
  public readonly cloudwatchLambdaInvokeErrors: lambda.Permission;
  public readonly cloudwatchLambdaInvokeComplete: lambda.Permission;

  constructor(scope: Construct, id: string, props: LambdaPermissionsProps) {
    super(scope, id);

    const rules = new Rules(this, 'Rules', {
      stackName: props.stackName,
    });

    this.s3LambdaInvokeVideo = {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: `${Stack.of(this).account}`,
    };

    this.cloudwatchLambdaInvokeErrors = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: rules.encodeError.ruleArn,
    };

    this.cloudwatchLambdaInvokeComplete = {
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceArn: rules.encodeComplete.ruleArn,
    };
  }
}
