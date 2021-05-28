import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import { DynamoDbTables } from './dynamodb-tables';
import { S3Buckets } from './s3-buckets';
import { CloudFronts } from './cloudfronts';
import { CustomResources } from './custom-resources';
import { SnsTopics } from './sns-topics';
import { SqsQueues } from './sqs-queues';

export interface OutputsProps {
  cloudFronts: CloudFronts;
  customResources: CustomResources;
  dynamoDbTables: DynamoDbTables;
  s3Buckets: S3Buckets;
  snsTopics: SnsTopics;
  sqsQueues: SqsQueues;
  stackName: string;
}

export class Outputs extends Construct {
  public readonly cloudFront: CfnOutput;
  public readonly destinationBucket: CfnOutput;
  public readonly dynamoDbTable: CfnOutput;
  public readonly sourceBucket: CfnOutput;
  public readonly snsTopic: CfnOutput;
  public readonly sqsArn: CfnOutput;
  public readonly sqsUrl: CfnOutput;
  public readonly uuid: CfnOutput;

  constructor(scope: Construct, id: string, props: OutputsProps) {
    super(scope, id);

    this.cloudFront = new CfnOutput(this, 'CloudFrontOutput', {
      description: `${props.stackName} CloudFront Domain Name`,
      value: props.cloudFronts.distribution.domainName,
      exportName: `${props.stackName}-CloudFront`,
    });

    this.destinationBucket = new CfnOutput(this, 'DestinationBucketOutput', {
      description: `${props.stackName} Destination S3 Bucket`,
      value: props.s3Buckets.destination.bucketName,
      exportName: `${props.stackName}-DestinationBucket`,
    });

    this.dynamoDbTable = new CfnOutput(this, 'DynamoDbTableOutput', {
      description: `${props.stackName} DynamoDB Table`,
      value: props.dynamoDbTables.videoInfo.tableName ?? '',
      exportName: `${props.stackName}-DynamoDbTable`,
    });

    this.sourceBucket = new CfnOutput(this, 'SourceBucketOutput', {
      description: `${props.stackName} Source S3 Bucket`,
      value: props.s3Buckets.source.bucketName,
      exportName: `${props.stackName}-SourceBucket`,
    });

    this.snsTopic = new CfnOutput(this, 'SnsTopicOutput', {
      description: `${props.stackName} SNS Notification Topic`,
      value: props.snsTopics.notifications.topicArn,
      exportName: `${props.stackName}-SnsTopic`,
    });

    this.sqsArn = new CfnOutput(this, 'SqsQueueArnOutput', {
      description: `${props.stackName} SQS Queue ARN`,
      value: props.sqsQueues.main.queueArn,
      exportName: `${props.stackName}-SqsQueueArn`,
    });

    this.sqsUrl = new CfnOutput(this, 'SqsQueueUrlOutput', {
      description: `${props.stackName} SQS Queue URL`,
      value: props.sqsQueues.main.queueUrl,
      exportName: `${props.stackName}-SqsQueueUrl`,
    });
  }
}
