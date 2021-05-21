import { Construct } from 'constructs';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';

export interface CloudfrontOriginAccessIdentitiesProps {
  stackName: string;
}

export class CloudfrontOriginAccessIdentities extends Construct {
  public readonly destination: cloudfront.OriginAccessIdentity;

  constructor(
    scope: Construct,
    id: string,
    props: CloudfrontOriginAccessIdentitiesProps
  ) {
    super(scope, id);

    this.destination = new cloudfront.OriginAccessIdentity(
      this,
      'CloudfrontDestinationOriginAccessIdentity'
    );
  }
}
