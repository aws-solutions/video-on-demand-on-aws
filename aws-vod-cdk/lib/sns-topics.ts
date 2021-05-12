import { Construct } from 'constructs';
import { aws_sns as sns } from 'aws-cdk-lib';

export interface SnsTopicsProps {
  stackName: string;
  stackStage: string;
}

export class SnsTopics extends Construct {
  public readonly notifications: sns.Topic;
  constructor(scope: Construct, id: string, props: SnsTopicsProps) {
    super(scope, id);

    this.notifications = new sns.Topic(this, 'Notifications', {
      displayName: `${props.stackStage}${props.stackName}Notifications`,
    });
  }
}
