import { Construct } from 'constructs';
import { aws_events as events } from 'aws-cdk-lib';

export interface RulesProps {
  stackName: string;
}

export class Rules extends Construct {
  public readonly encodeComplete: events.Rule;
  public readonly encodeError: events.Rule;

  constructor(scope: Construct, id: string, props: RulesProps) {
    super(scope, id);

    this.encodeComplete = new events.Rule(this, 'EncodeCompleteRule', {
      ruleName: `${props.stackName}-EncodeCompleteRule`,
      description: 'MediaConvert Completed event rule',
    });

    this.encodeError = new events.Rule(this, 'EncodeErrorRule', {
      ruleName: `${props.stackName}-EncodeErrorRule`,
      description: 'MediaConvert Error event rule',
    });
  }
}
