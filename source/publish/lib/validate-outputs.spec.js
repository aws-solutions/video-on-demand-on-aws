'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../validate-outputs.js');

describe('lambda', function() {

  let _event = {
      "guid": "e6ff7e45e109",
      "msg": {
          "inputCount": 1,
          "outputKeyPrefix": "e6ff7e1/mp4/",
          "outputs": [
              {
                  "id": "1",
                  "presetId": "f402id",
                  "key": "cccc-mp4-234p.mp4",
                  "height": 234
              },
              {
                  "id": "2",
                  "presetId": "bizdc5",
                  "key": "cccc-mp4-270p.mp4",
                  "height": 270
              }
          ],
          "userMetadata": {
              "guid": "e6ff79",
              "preset": "mp4"
          }
      },
      "preset": "mp4"
  };

  let data = {
    ContentLength: 12345
  }
  let outputs =[];


  describe('#validate-outputs ', function() {

    beforeEach(function() {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'testlambda';
      process.env.Mp4Dest = 'bucket';
    });

    afterEach(function() {
      AWS.restore('S3');
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.Mp4Dest;
    });

    it('should return "data" when s3 head successful', function(done) {

      AWS.mock('S3', 'headObject', Promise.resolve());

      lambda.handler(_event, null, function(err, data) {
        if (err) done(err);
        else {
          assert.equal(data, _event);
          done();
        }
      });
    });
    /*
    it('should return "s3 error" when s3 head fails and sns successful', function(done) {

      AWS.mock('S3', 'headObject', Promise.reject('s3 error'));

      AWS.mock('SNS', 'publish', Promise.resolve('sucess'));

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

      AWS.mock('S3', 'headObject', Promise.reject('s3 error'));

      AWS.mock('SNS', 'publish', Promise.reject('sns error'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('s3 error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
    */

  });
});
