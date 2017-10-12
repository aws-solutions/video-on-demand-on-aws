//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';
let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('./cloudfront.js');

describe('lambda', function() {

  let data = {
    CloudFrontOriginAccessIdentity:{
    S3CanonicalUserId:'5678'
  },
  Id:'1234'
  };

  describe('#CloudFront Identity', function() {

    beforeEach(function() {

    });

    afterEach(function() {
      AWS.restore('CloudFront');
    });

    it('should return "Data" when create Identity is successful', function(done) {

      AWS.mock('CloudFront', 'createCloudFrontOriginAccessIdentity', function (params, callback){
        callback(null, data);
      });

      lambda.createIdentity()
        .then(responseData => {
          expect(responseData.Identity).to.have.lengthOf(4);
          expect(responseData.S3CanonicalUserId).to.have.lengthOf(4);
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    });
});
