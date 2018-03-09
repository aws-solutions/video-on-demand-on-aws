//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../media-convert-get-details.js');

describe('lambda', function() {
  let _event = {
    "detail": {
      "userMetadata": {
        "guid": "21312312"
      }
    }
  };
  let data = {
    Item:"test"
  }

  describe('#MEDIA CONVERT Get Details', function() {

    beforeEach(function() {
      process.env.ErrorHandler = "errHandler";
    });

    afterEach(function() {
      AWS.restore('DynamoDB.DocumentClient');
      AWS.restore('Lambda');
      delete process.env.ErrorHandler;
    });

    it('should return "sucess" when db get success', function(done) {

        AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

        lambda.handler(_event, null, function(err, data) {
            if (err) done(err);
            else {
                assert.equal(data, 'test');
                done();
            }
        });
    });
    it('should return "db error" when db put error & Lambda success', function(done) {

      AWS.mock('DynamoDB.DocumentClient', 'get', Promise.reject('db error'));

      AWS.mock('Lambda', 'invoke', Promise.resolve('sucess'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('db error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
    it('should return "db error" when db put error & lambda error', function(done) {

      AWS.mock('DynamoDB.DocumentClient', 'get', Promise.reject('db error'));

      AWS.mock('Lambda', 'invoke', Promise.reject('lambda error'));

      lambda.handler(_event, null, function(err, data) {
        if (err) {
          expect(err).to.equal('db error');
          done();
        } else {
          done('invalid failure for negative test');
        }
      });
    });
  });
});
