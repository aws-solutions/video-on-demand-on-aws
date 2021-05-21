import { Construct } from 'constructs';
import { aws_kms as kms } from 'aws-cdk-lib';

export interface KmsKeysProps {
  stackName: string;
}

export class KmsKeys extends Construct {
  public readonly snsMasterKey: kms.Key;
  public readonly sqsMasterKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsKeysProps) {
    super(scope, id);

    this.snsMasterKey = new kms.Key(this, 'SnsKmsMasterKey', {
      alias: `alias/aws/${props.stackName}-SnsMasterKey`,
    });

    this.sqsMasterKey = new kms.Key(this, 'SqsKmsMasterKey', {
      alias: `alias/aws/${props.stackName}-SqsMasterKey`,
    });
  }
}
