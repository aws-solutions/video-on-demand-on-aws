import { Construct } from 'constructs';
import { aws_cloudfront as cloudfront } from 'aws-cdk-lib';

export interface CloudfrontProps {
  stackName: string;
  stackStage: string;
}

export class Cloudfront extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudfrontProps) {
    super(scope, id);
  }
}
