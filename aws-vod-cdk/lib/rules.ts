import { Construct } from 'constructs';
import { aws_events as events } from 'aws-cdk-lib';

export interface RulesProps {
  stackName: string;
  stackStage: string;
}

export class Rules extends Construct {
  public readonly encodeCompleteRule: events.Rule;
  public readonly encodeCompleteRuleEventPattern: events.EventPattern;
  public readonly encodeErrorRule: events.Rule;
  public readonly encodeErrorRuleEventPattern: events.EventPattern;

  constructor(scope: Construct, id: string, props: RulesProps) {
    super(scope, id);

    this.encodeCompleteRuleEventPattern = {
      source: ['aws.mediaconvert'],
      detail: {
        status: 'COMPLETE',
      },
    };

    this.encodeCompleteRule = new events.Rule(this, 'EncodeCompleteRule', {
      ruleName: `${props.stackStage}${props.stackName}EncodeCompleteRule`,
      description: 'MediaConvert Completed event rule',
      eventPattern: this.encodeCompleteRuleEventPattern,
    });

    this.encodeCompleteRuleEventPattern = {
      source: ['aws.mediaconvert'],
      detail: {
        status: 'ERROR',
      },
    };

    this.encodeErrorRule = new events.Rule(this, 'EncodeErrorRule', {
      ruleName: `${props.stackStage}${props.stackName}EncodeErrorRule`,
      description: 'MediaConvert Error event rule',
      eventPattern: this.encodeErrorRuleEventPattern,
    });
  }
}
