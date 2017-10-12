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
    "Records": [
        {
        "Sns": {
                "Type": "Notification",
                "MessageId": "33e1def3-f5fd-5296-8894-8cf7a989a823",
                "TopicArn": "arn",
                "Subject": "Workflow error: 123",
                "Message": "{\n  \"event\": \"success\",\n  \"function\": \"meta-dynamo\",\n  \"error\": \"ValidationException: Invalid UpdateExpression: Syntax error; token: \\\"0\\\", near: \\\"set  0 =\\\"\"\n}"
            }
        }
    ]
};

    describe('#handler', function() {

        beforeEach(function() {
        });

        afterEach(function() {
            AWS.restore('DynamoDB.DocumentClient');
            AWS.restore('SNS');
        });

        it('should return "success" when db put success', function(done) {

            AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve('sucess'));

            AWS.mock('SNS', 'publish', Promise.resolve('sucess'));

            lambda.handler(_event, null, function(err, data) {
                if (err) done(err);
                else {
                    assert.equal(data, 'sucess');
                    done();
                }
            });
        });
        it('should return "db error" when db put fails', function(done) {

            AWS.mock('DynamoDB.DocumentClient', 'update', Promise.reject('db error'))

            lambda.handler(_event, null, function(err, data) {
                if (err) {
                    expect(err).to.equal('db error');
                    done();
                } else {
                    done('invalid failure for negative test');
                }
            });
        });
        it('should return "sns error" when db put fails', function(done) {

            AWS.mock('DynamoDB.DocumentClient', 'update', Promise.resolve('sucess'));

            AWS.mock('SNS', 'publish', Promise.reject('sns error'));

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
