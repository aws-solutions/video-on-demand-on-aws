import { Construct } from 'constructs';
import { aws_iam as iam } from 'aws-cdk-lib';

export interface PolicyDocumentsProps {
  stackName: string;
  stackStage: string;
}

export class PolicyDocuments extends Construct {
  public readonly destinationBucketPolicyDocument: iam.PolicyDocument;

  constructor(scope: Construct, id: string, props: PolicyDocumentsProps) {
    super(scope, id);

    this.destinationBucketPolicyDocument = new iam.PolicyDocument();
  }
}
