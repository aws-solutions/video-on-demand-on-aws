//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../encode-dash.js');

describe('lambda', function() {
    let _event = {
        guid: "12345678",
        srcBucket: "testBucket",
        srcVideo: "example.mpg",
        dash:[720]
    };

    let data = {Job:{Id:1234}};

    describe('#encode-dash ', function() {

        beforeEach(function() {
          process.env.AbrPipeline = 1234
        });

        afterEach(function() {
            AWS.restore('ElasticTranscoder');
            AWS.restore('SNS');
            delete process.env.AbrPipeline
        });

        it('should return "success" when ets createjob success', function(done) {

            AWS.mock('ElasticTranscoder', 'createJob', Promise.resolve(data));

            lambda.handler(_event, null, function(err, data) {
                if (err) done(err);
                else {
                    assert.equal(data, _event);
                    done();
                }
            });
        });
        it('should return "ets error" when ets createjob fails & sns success', function(done) {

            AWS.mock('ElasticTranscoder', 'createJob', Promise.reject('ets error'));

            AWS.mock('SNS', 'publish', Promise.resolve('sucess'));

            lambda.handler(_event, null, function(err, data) {
                if (err) {
                    expect(err).to.equal('ets error');
                    done();
                } else {
                    done('invalid failure for negative test');
                }
            });
        });
        it('should return "ets error" when ets createjob fails & sns fails', function(done) {

            AWS.mock('ElasticTranscoder', 'createJob', Promise.reject('ets error'));

            AWS.mock('SNS', 'publish', Promise.reject('sns error'));

            lambda.handler(_event, null, function(err, data) {
                if (err) {
                    expect(err).to.equal('ets error');
                    done();
                } else {
                    done('invalid failure for negative test');
                }
            });
        });
    });
});
