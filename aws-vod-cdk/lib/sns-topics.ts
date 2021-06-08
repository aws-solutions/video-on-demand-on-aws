import { Construct } from 'constructs';
import {
  aws_sns as sns,
  aws_sns_subscriptions as subscriptions,
} from 'aws-cdk-lib';
import { KmsKeys } from './kms-keys';

export interface SnsTopicsProps {
  adminEmail: string;
  kmsKeys: KmsKeys;
  stackName: string;
}

export class SnsTopics extends Construct {
  public readonly notifications: sns.Topic;

  constructor(scope: Construct, id: string, props: SnsTopicsProps) {
    super(scope, id);

    this.notifications = new sns.Topic(this, 'Notifications', {
      displayName: `${props.stackName}-Notifications`,
      // masterKey: props.kmsKeys.snsMasterKey,
    });

    this.notifications.addSubscription(
      new subscriptions.EmailSubscription(props.adminEmail)
    );
  }
}
