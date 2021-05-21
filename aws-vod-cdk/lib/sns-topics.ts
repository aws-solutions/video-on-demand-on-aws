import { Construct } from 'constructs';
import { aws_sns as sns } from 'aws-cdk-lib';
import { KmsKeys } from './kms-keys';

export interface SnsTopicsProps {
  kmsKeys: KmsKeys;
  stackName: string;
}

export class SnsTopics extends Construct {
  public readonly notifications: sns.Topic;
  public readonly notificationsSubscription: sns.Subscription;

  constructor(scope: Construct, id: string, props: SnsTopicsProps) {
    super(scope, id);

    const adminEmail =
      this.node.tryGetContext('adminEmail') != null
        ? this.node.tryGetContext('adminEmail')
        : '';

    this.notifications = new sns.Topic(this, 'Notifications', {
      displayName: `${props.stackName}-Notifications`,
      masterKey: props.kmsKeys.snsMasterKey,
    });

    this.notificationsSubscription = new sns.Subscription(
      this,
      'NotificationsSubscription',
      {
        endpoint: adminEmail,
        protocol: sns.SubscriptionProtocol.EMAIL,
        topic: this.notifications,
      }
    );
  }
}
