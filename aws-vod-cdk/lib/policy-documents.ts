import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';

export interface PolicyDocumentsProps {
  stackName: string;
}

export class PolicyDocuments extends Construct {
  public readonly destinationBucket: iam.PolicyDocument;

  constructor(scope: Construct, id: string, props: PolicyDocumentsProps) {
    super(scope, id);

    this.destinationBucket = new iam.PolicyDocument();
  }
}
