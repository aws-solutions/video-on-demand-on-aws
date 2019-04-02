/*******************************************************************************
* Copyright 2019 Amazon.com, Inc. and its affiliates. All Rights Reserved.
*
* Licensed under the Amazon Software License (the "License").
* You may not use this file except in compliance with the License.
* A copy of the License is located at
*
*   http://aws.amazon.com/asl/
*
* or in the "license" file accompanying this file. This file is distributed
* on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
* express or implied. See the License for the specific language governing
* permissions and limitations under the License.
*
********************************************************************************/
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./index.js');

  let _video = {
    WorkflowTrigger:'VideoFile',
    IngestArn:'arn',
    Source:'srcBucket'
  }

  let _metadata = {
    WorkflowTrigger:'MetadataFile',
    IngestArn:'arn',
    Source:'srcBucket'
  }

  let _api = {
    WorkflowTrigger:'Api',
    IngestArn:'arn',
    Source:'srcBucket'
  }

  let res = 'success';

  describe('#S3 PUT NOTIFICATION::',() => {

    it('should return "success" on Video s3 s3 event type ', async () => {

      AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());

      let response = await lambda.putNotification(_video)
      expect(response).to.equal('success');
    });

    it('should return "success" on Metadata s3 event type', async () => {

      AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.resolve());

      let response = await lambda.putNotification(_metadata)
      expect(response).to.equal('success');
    });

    it('should return "success" on Api s3 event type', async () => {

      let response = await lambda.putNotification(_api)
      expect(response).to.equal('success');
    });

    it('should return "ERROR" on Video s3 s3 event type', async () => {
  		AWS.mock('S3', 'putBucketNotificationConfiguration', Promise.reject('ERROR'));

  		await lambda.putNotification(_video).catch(err => {
  			expect(err).to.equal('ERROR');
  		});
  	});

});
