//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./media-convert.js');

describe('lambda', function() {

  let data = {
    Endpoints: [{
      Url: 'https://test.mediaconvert.us-east-1.amazonaws.com'
    }]
  };

  let _event = {
    ResourceProperties:{
      Workflow:'test',
      EndPoint: 'https://test.mediaconvert.us-east-1.amazonaws.com'
    }
  }

  describe('#Media Convert', function() {

    beforeEach(function() {

    });

    afterEach(function() {
      AWS.restore('MediaConvert');
    });

    it('should return "Data" when describeEndpoints is successful', function(done) {

      AWS.mock('MediaConvert', 'describeEndpoints', function(callback) {
        callback(null, data);
      });

      lambda.endpointUrl()
        .then(responseData => {
          expect(responseData.EndpointUrl).to.equal('https://test.mediaconvert.us-east-1.amazonaws.com');
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('should return "Data" when createPreset is successful', function(done) {

      AWS.mock('MediaConvert', 'createPreset', function(params,callback) {
        callback(null, data);
      });

      lambda.createPreset(_event)
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
