//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
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
