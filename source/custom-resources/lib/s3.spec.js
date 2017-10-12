//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./s3.js');

describe('lambda', function() {

  let _event = {
    ResourceProperties:{
      Source:'bucket',
      IngestArn: 'arn****'
    }
  }
  let data = {
    ContentLength: 12345
  }

  describe('#S3', function() {

    beforeEach(function() {
    });

    afterEach(function() {
      AWS.restore('S3');
    });

    it('should return S3 PUT NOTIFICATION successful', function(done) {

      AWS.mock('S3', 'putBucketNotificationConfiguration', function (params, callback){
        callback(null, data);
      });

      lambda.s3Notification(_event)
        .then(responseData => {
          expect(responseData).to.equal('sucess');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return S3 PUT OBJECT success', function(done) {

      AWS.mock('S3', 'putObject', function (params, callback){
        callback(null, data);
      });

      lambda.putObject(_event)
        .then(responseData => {
          expect(responseData).to.equal('sucess');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    });
});
