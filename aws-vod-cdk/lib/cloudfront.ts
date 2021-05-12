import { Construct } from 'constructs';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';

export interface CloudfrontProps {
  stackName: string;
  stackStage: string;
}

export class Cloudfront extends Construct {
  public readonly destinationOriginAccessIdentity: cloudfront.OriginAccessIdentity;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudfrontProps) {
    super(scope, id);

    this.destinationOriginAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'CloudfrontDestinationOriginAccessIdentity',
      {}
    );
  }
}
