import { Construct } from 'constructs';
import { aws_dynamodb as dynamoDb, CfnDeletionPolicy } from 'aws-cdk-lib';

export interface DynamoDbTablesProps {
  stackName: string;
}

export class DynamoDbTables extends Construct {
  public readonly videoInfo: dynamoDb.CfnTable;

  constructor(scope: Construct, id: string, props: DynamoDbTablesProps) {
    super(scope, id);

    // Utilize CfnTable Construct to allow access to
    // required items such as KeySchema, etc.
    this.videoInfo = new dynamoDb.CfnTable(this, 'VideoInfoDynamoDbTable', {
      tableName: `${props.stackName}-VideoInfo`,
      attributeDefinitions: [
        {
          attributeName: 'guid',
          attributeType: 'S',
        },
        {
          attributeName: 'srcBucket',
          attributeType: 'S',
        },
        {
          attributeName: 'startTime',
          attributeType: 'S',
        },
      ],
      keySchema: [
        {
          attributeName: 'guid',
          keyType: 'HASH',
        },
      ],
      globalSecondaryIndexes: [
        {
          indexName: 'srcBucket-startTime-index',
          keySchema: [
            {
              attributeName: 'srcBucket',
              keyType: 'HASH',
            },
            {
              attributeName: 'startTime',
              keyType: 'RANGE',
            },
          ],
          projection: {
            projectionType: 'ALL',
          },
        },
      ],
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      billingMode: 'PAY_PER_REQUEST',
    });

    this.videoInfo.cfnOptions.deletionPolicy = CfnDeletionPolicy.RETAIN;
    this.videoInfo.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.RETAIN;
  }
}
