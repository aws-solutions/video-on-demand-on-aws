/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const chai = require('chai');
const spies = require('chai-spies');
const assertArrays = require('chai-arrays');
chai.use(assertArrays).use(spies);

const expect = chai.expect;
const spy = chai.spy;

const nock = require('nock');
const path = require('path');
const AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

const lambda = require('../index.js');

describe('#BROADCAST::', () => {

  process.env.AWS_REGION = 'us-west-1';
  process.env.SnsTopic = `arn:aws:sns:${process.env.AWS_REGION}:000000000000:my-sns-topic`;
  process.env.ErrorHandler = 'buzzhub-error-handler';
  process.env.DistributionId = 'video-distribution';
  process.env.DistributionIdRestricted = 'video-distribution-restricted';

  afterEach(() => AWS.restore('CloudFront'));
  afterEach(() => AWS.restore('SSM'));
  afterEach(() => AWS.restore('SNS'));


  const mediaId = 'foo-bar';
  const ssmFixture = {
    Parameters: [{
      Name: '/external/livingdocs/cms.base-url',
      Value: 'https://www.example.com'
    }, {
      Name: '/external/livingdocs/cms.token',
      Value: 's3cr3t'
    }]
  };
  const snsFixture = {Contents: [{Key: 'foo/bar/baz.ext'}]};
  const cfFixture = {A: "a"};

  const eventFixture = {
    guid: "foo-bar-id",
    cmsId: mediaId,
    srcVideo: '2021/11/foo-bar/animation-zeigt-diese-laender-sind-die-groessten-klimasuender.mp4'
  }

  it("forward change to SNS", async () => {
    const snsSpy = spy((params, callback) => {
      callback(null, snsFixture);
    });
    AWS.mock("CloudFront", "createInvalidation", Promise.resolve());
    AWS.mock("SNS", "publish", snsSpy);
    AWS.mock("SSM", "getParameters", Promise.resolve(ssmFixture));

    const scope = nock('https://www.example.com')
      .get(`/api/beta/mediaLibrary/${mediaId}/incomingDocumentReferences`)
      .reply(200, [{id: 987654321}]);

    await lambda.handler(eventFixture);

    expect(snsSpy).to.have.been.called.with({
      "Message": "987654321",
      "Subject": "987654321",
      "TargetArn": process.env.SnsTopic
    });
    scope.isDone();
  });

  it("create invalidation in CDN", async () => {
    const invalidationSpy = spy((params, callback) => {
      setTimeout(() => callback(null, cfFixture), 100);
    });
    AWS.mock("CloudFront", "createInvalidation", invalidationSpy);
    AWS.mock("SNS", "publish", Promise.resolve());
    AWS.mock("SSM", "getParameters", Promise.resolve(ssmFixture));

    const scope = nock('https://www.example.com')
        .get(`/api/beta/mediaLibrary/${mediaId}/incomingDocumentReferences`)
        .reply(200, [{id: 987654321}]);

    await lambda.handler(eventFixture);

    expect(invalidationSpy).to.have.been.first.called.with({
      "DistributionId": process.env.DistributionId,
      "InvalidationBatch": {
        "CallerReference": eventFixture.guid,
        "Paths": {"Items": ["/2021/11/foo-bar/*"], "Quantity": 1}
      }
    });

    expect(invalidationSpy).to.have.been.second.called.with({
      "DistributionId": process.env.DistributionIdRestricted,
      "InvalidationBatch": {
        "CallerReference": eventFixture.guid,
        "Paths": {"Items": ["/2021/11/foo-bar/*"], "Quantity": 1}
      }
    });
    scope.isDone();
  });

  it('handle SNS errors', async () => {
    AWS.mock("CloudFront", "createInvalidation", Promise.resolve());
    AWS.mock('Lambda', 'invoke', Promise.resolve());
    AWS.mock("SSM", "getParameters", Promise.resolve(ssmFixture));
    AWS.mock('SNS', 'publish', Promise.reject('SNS ERROR'));

    const scope = nock('https://www.example.com')
        .get(`/api/beta/mediaLibrary/${mediaId}/incomingDocumentReferences`)
        .reply(200, [{id: 987654321}]);

    await lambda.handler(eventFixture)
        .catch(err => {
          scope.done();
          expect(err).to.equal('SNS ERROR');
        });

  });

});
