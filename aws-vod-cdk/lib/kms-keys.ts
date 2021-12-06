import { Construct } from 'constructs';
import { aws_kms as kms, Duration, RemovalPolicy } from 'aws-cdk-lib';

export interface KmsKeysProps {
  stackName: string;
  stackStage: string;
}

export class KmsKeys extends Construct {
  public readonly snsMasterKey: kms.Key;
  public readonly sqsMasterKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsKeysProps) {
    super(scope, id);

    this.snsMasterKey = new kms.Key(this, 'SnsKmsMasterKey', {
      alias: `${props.stackName}-SnsMasterKey`,
      removalPolicy:
        props.stackStage === 'Prod'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
    });

    this.sqsMasterKey = new kms.Key(this, 'SqsKmsMasterKey', {
      alias: `${props.stackName}-SqsMasterKey`,
      removalPolicy:
        props.stackStage === 'Prod'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      pendingWindow: Duration.days(7),
    });
  }
}
