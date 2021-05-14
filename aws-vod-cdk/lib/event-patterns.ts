import { Construct } from 'constructs';
import { aws_events as events } from 'aws-cdk-lib';

export interface EventPatternsProps {
  stackName: string;
  stackStage: string;
}

export class EventPatterns extends Construct {
  public readonly encodeComplete: events.EventPattern;
  public readonly encodeError: events.EventPattern;

  constructor(scope: Construct, id: string, props: EventPatternsProps) {
    super(scope, id);

    this.encodeComplete = {
      source: ['aws.mediaconvert'],
      detail: {
        status: 'COMPLETE',
      },
    };

    this.encodeComplete = {
      source: ['aws.mediaconvert'],
      detail: {
        status: 'ERROR',
      },
    };
  }
}
