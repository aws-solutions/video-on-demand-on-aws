import {
  expect as expectCDK,
  matchTemplate,
  MatchStyle,
} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AwsVodCdk from '../lib/_aws-vod-cdk-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsVodCdk.AwsVodCdkStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
