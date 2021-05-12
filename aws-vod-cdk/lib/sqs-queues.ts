import { Construct } from 'constructs';
import { aws_sqs as sqs, Duration } from 'aws-cdk-lib';

export interface SqsQueuesProps {
  stackName: string;
  stackStage: string;
}

export class SqsQueues extends Construct {
  public readonly sqsQueue: sqs.Queue;
  public readonly sqsDeadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsQueuesProps) {
    super(scope, id);

    this.sqsDeadLetterQueue = new sqs.Queue(this, 'SqsDeadLetterQueue', {
      queueName: `${props.stackStage}${props.stackName}SqsDeadLetterQueue`,
      visibilityTimeout: Duration.seconds(120),
    });

    this.sqsQueue = new sqs.Queue(this, 'SqsQueue', {
      queueName: `${props.stackStage}${props.stackName}SqsQueue`,
      visibilityTimeout: Duration.seconds(120),
      deadLetterQueue: {
        queue: this.sqsDeadLetterQueue,
        maxReceiveCount: 1,
      },
    });
  }
}
