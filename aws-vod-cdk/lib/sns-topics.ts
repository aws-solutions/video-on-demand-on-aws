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
      masterKey: props.kmsKeys.snsMasterKey,
    });

    // The below code does not work; passing a parameter to the EmailSubscription
    // construct results in an error. For now, hard-code an email.
    // A bug report has been filed  (https://github.com/aws/aws-cdk/issues/14919)
    this.notifications.addSubscription(
      new subscriptions.EmailSubscription(props.adminEmail)
      // new subscriptions.EmailSubscription('amkuchta@gmail.com')
    );
  }
}
