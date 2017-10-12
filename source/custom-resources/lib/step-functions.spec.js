//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./step-functions.js');

describe('lambda', function() {

  let _event = {
    LogicalResourceId: 'ProcessWorkflow',
    PhysicalResourceId: 'arn',
    ResourceProperties: {
      Name: 'abcd',
      RoleArn: 'arn:aws:*::*:*',
      Profiler: 'arn:aws:*::*:*',
      EncodeHls: 'arn:aws:*::*:*',
      EncodeMp4: 'arn:aws:*::*:*',
      EncodeDash: 'arn:aws:*::*:*',
      Dynamo: 'arn:aws:*::*:*',
      Name: 'example'
    }
  }

  let data = {
    stateMachineArn: 'arn::1234'
  };

  describe('#Step Functions', function() {

    beforeEach(function() {
      process.env.AWS_REGION = 'us-east-1'
    });

    afterEach(function() {
      AWS.restore('StepFunctions');
    });

    it('should return CREATE', function(done) {

      AWS.mock('StepFunctions', 'createStateMachine', function(params, callback) {
        callback(null, data);
      });

      lambda.createSteps(_event)
        .then(responseData => {
          expect(responseData.StepsArn).to.be.a('string');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return DELETE', function(done) {

      AWS.mock('StepFunctions', 'deleteStateMachine', function(params, callback) {
        callback(null, 'success');
      });

      lambda.deleteSteps(_event)
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
