import { Construct } from 'constructs';
import { aws_stepfunctions as stepfunctions } from 'aws-cdk-lib';

export interface StepFunctionsProps {
  stackName: string;
  stackStage: string;
}

export class StepFunctions extends Construct {
  constructor(scope: Construct, id: string, props: StepFunctionsProps) {
    super(scope, id);
  }
}
