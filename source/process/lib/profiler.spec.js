//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../profiler.js');

describe('lambda', function() {
    let _event = {
        guid: "12345678",
        srcBucket: "testBucket",
        srcMetadata: "example.json"
    };

    let data = {
        Item: {
            guid: "12345678",
            srcMediainfo:"{\"video\":[{\"height\":720,\"width\":480}]}",
            hls: [
                720,
                540
            ],
        }
    };

    describe('#handler', function() {

        beforeEach(function() {
          process.env.ErrorHandler = "errHandler";
        });

        afterEach(function() {
            AWS.restore('DynamoDB.DocumentClient');
            AWS.restore('Lambda');
            delete process.env.ErrorHandler;
        });

        it('should return "success" when db get success', function(done) {

            AWS.mock('DynamoDB.DocumentClient', 'get', Promise.resolve(data));

            lambda.handler(_event, null, function(err, data) {
                if (err) done(err);
                else {
                    assert.equal(data, _event);
                    done();
                }
            });
        });
        it('should return "db error" when db get error & sns success', function(done) {

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
        it('should return "db error" when db get error & sns error', function(done) {

            AWS.mock('DynamoDB.DocumentClient', 'get', Promise.reject('db error'));

            AWS.mock('Lambda', 'invoke', Promise.reject('sns error'));

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
