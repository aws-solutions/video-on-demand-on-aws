//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../media-convert-encode.js');

describe('lambda', function() {
  let _event = {
    guid: "12345678",
    srcBucket: "testBucket",
    srcVideo: "example.mpg",
    mp4: [216,1080,720],
    hls:[1080,720,540,360,270],
    dash:[1080,720,540,360,270],
    frameCapture: true
  };

  let data = {
    Job: {
      Id: '1234'
    }
  }

  describe('#encode ', function() {

    beforeEach(function() {
      process.env.ErrorHandler = "errHandler";
    });

    afterEach(function() {
      AWS.restore('MediaConvert');
      AWS.restore('Lambda');
      delete process.env.ErrorHandler;
    });

    it('should return "success" when createjob success', function(done) {

      AWS.mock('MediaConvert', 'createJob', Promise.resolve(data));

      lambda.handler(_event, null, function(err, data) {
        if (err) done(err);
        else {
          assert.equal(data, _event);
          done();
        }
      });
    });
    it('should return "MediaConvert error" when ets createjob fails & sns success', function(done) {

      AWS.mock('MediaConvert', 'createJob', Promise.reject('mv error'));

      AWS.mock('Lambda', 'invoke', Promise.resolve('sucess'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('mv error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
    it('should return "MediaConvert error" when ets createjob fails & sns fails', function(done) {

      AWS.mock('MediaConvert', 'createJob', Promise.reject('mv error'));

      AWS.mock('Lambda', 'invoke', Promise.reject('lambda error'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('mv error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
  });
});
