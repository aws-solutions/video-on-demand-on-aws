//AWS_REGION='us-east-1' mocha ingest/ingest-sns.spec.js
'use strict';

let assert = require('chai').assert;
let expect = require('chai').expect;
var path = require('path');
let AWS = require('aws-sdk-mock');
AWS.setSDK(path.resolve('./node_modules/aws-sdk'));

let lambda = require('../index.js');

describe('lambda', function() {
    let _event = {
        guid:"12345678",
        workflowStatus:"ingest",
        srcVideo:"example.mpg"
    };

    describe('#sns ', function() {

        beforeEach(function() {
          process.env.AWS_LAMBDA_FUNCTION_NAME = 'testlambda';
          process.env.ErrorHandler = "errHandler";
        });

        afterEach(function() {
            AWS.restore('SNS');
            delete process.env.AWS_LAMBDA_FUNCTION_NAME;
            delete process.env.ErrorHandler;
        });

        it('should return "success" when sns publish successful', function(done) {

            AWS.mock('SNS', 'publish', Promise.resolve('sucess'));

            lambda.handler(_event, null, function(err, data) {
                if (err) done(err);
                else {
                    assert.equal(data, _event);
                    done();
                }
            });
        });
        it('should return "sns error" when sns publish fails', function(done) {

            AWS.mock('SNS', 'publish', Promise.reject('sns error'));

            AWS.mock('Lambda', 'invoke', Promise.resolve('sucess'));

            lambda.handler(_event, null, function(err, data) {
                if (err) {
                    expect(err).to.equal('sns error');
                    done();
                } else {
                    done('invalid failure for negative test');
                }
            });
        });
        it('should return "sns error" when lambda invoke fails', function(done) {

            AWS.mock('SNS', 'publish', Promise.reject('sns error'));

            AWS.mock('Lambda', 'invoke', Promise.reject('lambda error'));

            lambda.handler(_event, null, function(err, data) {
                if (err) {
                    expect(err).to.equal('sns error');
                    done();
                } else {
                    done('invalid failure for negative test');
                }
            });
        });
    });
});
