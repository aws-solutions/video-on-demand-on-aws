'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../validate-metadata.js');

describe('lambda', function() {
  let _event = {
    guid: "55ebfeba-acfc-4bce-981a-ea860595442c",
    srcMetadataFile: "cccc/cccc.json",
    srcBucket: "bucket"
  };

  let data = {
    ContentType:"json",
    Body:"{\"srcVideo\": \"test.mpg\",\"hls\": [720, 540]}"
  };

  describe('#validate metadata', function() {

    beforeEach(function() {
      process.env.ErrorHandler = "errHandler";
    });

    afterEach(function() {
      AWS.restore('S3');
      AWS.restore('SNS');
      delete process.env.ErrorHandler;
    });

    it('should return "data" when s3 getObject successful', function(done) {

      AWS.mock('S3', 'getObject', Promise.resolve(data));

      lambda.handler(_event, null, function(err, data) {
        if (err) done(err);
        else {
          expect(err).to.be.null;
          assert.equal(data, _event);
          done();
        }
      });
    });

    it('should return "s3 error" when step execute successful', function(done) {

      AWS.mock('S3', 'getObject', Promise.reject('s3 error'));

      AWS.mock('Lambda', 'invoke', Promise.resolve('sucess'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('s3 error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
    it('should return "s3 error" when step execute successful', function(done) {

      AWS.mock('S3', 'getObject', Promise.reject('s3 error'));

      AWS.mock('Lambda', 'invoke', Promise.reject('lambda error'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('s3 error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
  });
});
