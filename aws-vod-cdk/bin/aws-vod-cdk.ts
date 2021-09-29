#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { AwsVodCdkStack } from '../lib/_aws-vod-cdk-stack';

const app = new App();

const stackStage =
  app.node.tryGetContext('stackStage') !== undefined
    ? `${app.node.tryGetContext('stackStage')}-`
    : '';

const stackName =
  app.node.tryGetContext('stackName') !== undefined
    ? `${app.node.tryGetContext('stackName')}`
    : 'AwsVodCdkStack';

const stackVersion =
  app.node.tryGetContext('stackVersion') !== undefined
    ? `${app.node.tryGetContext('stackVersion')}`
    : 'AwsVodCdkStack';

new AwsVodCdkStack(app, stackName, {
  stackName: `${stackStage}${stackName}`,
  description: `(SO0021) - Video On Demand workflow with AWS Step Functions, MediaConvert, MediaPackage, S3, CloudFront and DynamoDB. Version ${stackVersion}`,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
