import { Construct } from 'constructs';
import { aws_s3 as s3, CfnDeletionPolicy } from 'aws-cdk-lib';
import { BucketAccessControl } from 'aws-cdk-lib/lib/aws-s3';

export interface S3BucketsProps {
  stackName: string;
  stackStage: string;
}

export class S3Buckets extends Construct {
  public readonly destination: s3.CfnBucket;
  public readonly logs: s3.CfnBucket;
  public readonly source: s3.CfnBucket;

  constructor(scope: Construct, id: string, props: S3BucketsProps) {
    super(scope, id);

    this.destination = new s3.CfnBucket(this, 'DestinationBucket', {
      bucketName: `${props.stackStage}${props.stackName}Destination`,
      corsConfiguration: {
        corsRules: [
          {
            allowedMethods: ['GET'],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
            maxAge: 3000,
          },
        ],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          { serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      },
    });

    this.destination.cfnOptions.deletionPolicy = CfnDeletionPolicy.RETAIN;
    this.destination.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.RETAIN;

    this.logs = new s3.CfnBucket(this, 'LogsBucket', {
      bucketName: `${props.stackStage}${props.stackName}Logs`,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          { serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });

    this.logs.cfnOptions.deletionPolicy = CfnDeletionPolicy.RETAIN;
    this.logs.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.RETAIN;

    this.source = new s3.CfnBucket(this, 'SourceBucket', {
      bucketName: `${props.stackStage}${props.stackName}Source`,
      lifecycleConfiguration: {
        rules: [
          {
            id: `${props.stackStage}${props.stackName}source-archive`,
            status: 'Enabled',
            tagFilters: [
              {
                key: `${props.stackStage}${props.stackName}`,
                value: 'GLACIER',
              },
            ],
            transition: {
              transitionInDays: 1,
              storageClass: 'GLACIER',
            },
          },
          {
            id: `${props.stackStage}${props.stackName}source-deep-archive`,
            status: 'Enabled',
            tagFilters: [
              {
                key: `${props.stackStage}${props.stackName}`,
                value: 'DEEP_ARCHIVE',
              },
            ],
            transition: {
              transitionInDays: 1,
              storageClass: 'DEEP_ARCHIVE',
            },
          },
        ],
      },
      bucketEncryption: {
        serverSideEncryptionConfiguration: [
          {
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    });

    this.source.cfnOptions.deletionPolicy = CfnDeletionPolicy.RETAIN;
    this.source.cfnOptions.updateReplacePolicy = CfnDeletionPolicy.RETAIN;
  }
}
