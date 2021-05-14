import { Construct } from 'constructs';
import { aws_sqs as sqs, Duration } from 'aws-cdk-lib';

export interface SqsQueuesProps {
  stackName: string;
  stackStage: string;
}

export class SqsQueues extends Construct {
  public readonly main: sqs.Queue;
  public readonly deadLetter: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsQueuesProps) {
    super(scope, id);

    this.deadLetter = new sqs.Queue(this, 'SqsDeadLetterQueue', {
      queueName: `${props.stackStage}${props.stackName}SqsDeadLetterQueue`,
      visibilityTimeout: Duration.seconds(120),
    });

    this.main = new sqs.Queue(this, 'MainSqsQueue', {
      queueName: `${props.stackStage}${props.stackName}MainSqsQueue`,
      visibilityTimeout: Duration.seconds(120),
      deadLetterQueue: {
        queue: this.deadLetter,
        maxReceiveCount: 1,
      },
    });
  }
}
