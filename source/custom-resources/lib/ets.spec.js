//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./ets.js');

describe('lambda', function() {

  let _event = {
    LogicalResourceId: 'ProcessWorkflow',
    PhysicalResourceId: 'aaaaaaaaaaa-6a7mvp',
    ResourceProperties: {
      Name: 'abcd',
      Role: 'arn:aws:*::*:*',
      Source: 'bucket',
      Dest: 'bucket2'
    }
  }
  let data = {
    Pipeline: {
      Id: '1111'
    }
  }

  describe('#ElasticTranscoder createPipeline', function() {

    beforeEach(function() {
      process.env.presetIds = '1111111,2222222';
    });

    afterEach(function() {
      AWS.restore('ElasticTranscoder');
    });

    it('should return CREATE PIPELINE success', function(done) {

      AWS.mock('ElasticTranscoder', 'createPipeline', function(params, callback) {
        callback(null, data);
      });

      lambda.createPipeline(_event)
        .then(responseData => {
          expect(responseData.PipelineId).to.be.a('string');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return DELETE PIPELINE success', function(done) {

      AWS.mock('ElasticTranscoder', 'deletePipeline', function(params, callback) {
        callback(null, 'success');
      });

      lambda.deletePipeline(_event)
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return DELETE PRESET success', function(done) {

      this.timeout(8000);
      setTimeout(done, 8000);

      AWS.mock('ElasticTranscoder', 'deletePreset', function(params, callback) {
        callback(null, 'success');
      });

      lambda.deletePreset()
        .then(() => {
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });
});
