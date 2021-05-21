import { Construct } from 'constructs';
import {
  aws_events as events,
  aws_events_targets as targets,
} from 'aws-cdk-lib';
import { EventPatterns } from './event-patterns';
import { LambdaFunctions } from './lambda-functions';

export interface RulesProps {
  eventPatterns: EventPatterns;
  lambdaFunctions: LambdaFunctions;
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

    this.encodeComplete.addEventPattern(props.eventPatterns.encodeComplete);

    this.encodeComplete.addTarget(
      new targets.LambdaFunction(props.lambdaFunctions.stepFunctions)
    );

    this.encodeError = new events.Rule(this, 'EncodeErrorRule', {
      ruleName: `${props.stackName}-EncodeErrorRule`,
      description: 'MediaConvert Error event rule',
    });

    this.encodeError.addEventPattern(props.eventPatterns.encodeError);

    this.encodeError.addTarget(
      new targets.LambdaFunction(props.lambdaFunctions.errorHandler)
    );
  }
}
