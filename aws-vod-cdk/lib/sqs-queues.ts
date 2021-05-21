import { Construct } from 'constructs';
import { aws_sqs as sqs, Duration } from 'aws-cdk-lib';
import { KmsKeys } from './kms-keys';

export interface SqsQueuesProps {
  kmsKeys: KmsKeys;
  stackName: string;
}

export class SqsQueues extends Construct {
  public readonly main: sqs.Queue;
  public readonly deadLetter: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsQueuesProps) {
    super(scope, id);

    this.deadLetter = new sqs.Queue(this, 'SqsDeadLetterQueue', {
      queueName: `${props.stackName}-SqsDeadLetterQueue`,
      visibilityTimeout: Duration.seconds(120),
      encryptionMasterKey: props.kmsKeys.sqsMasterKey,
      dataKeyReuse: Duration.seconds(300),
    });

    this.main = new sqs.Queue(this, 'MainSqsQueue', {
      queueName: `${props.stackName}-MainSqsQueue`,
      visibilityTimeout: Duration.seconds(120),
      encryptionMasterKey: props.kmsKeys.sqsMasterKey,
      dataKeyReuse: Duration.seconds(300),
      deadLetterQueue: {
        queue: this.deadLetter,
        maxReceiveCount: 1,
      },
    });
  }
}
