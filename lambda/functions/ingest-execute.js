/*********************************************************************************************************************
 *  Copyright 2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://aws.amazon.com/asl/                                                                                    *
 *                                                                                                                    *
 *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

/*
Lambda function evoked by S3 put object.
created GUID, gets source bucket and key
executes process step functions
guid used for step execute for tracking
*/
'use strict';
const AWS = require('aws-sdk');
const uuid = require('uuid');
const stepfunctions = new AWS.StepFunctions({
    region: process.env.AWS_REGION
});
const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
});
const sns = new AWS.SNS({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

    console.log(event.Records[0]);

    var db_params = {
        TableName: process.env.Dynamo,
        FilterExpression: 'srcVideo = :src',
        ExpressionAttributeValues: {
            ':src': event.Records[0].s3.object.key
        }
    };

    docClient.scan(db_params, function(err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else if (data.Items[0]) {

            var sns_params = {
                Message: 'The source video ' + event.Records[0].s3.object.key + ' has already been processed, see GUID: ' + data.Items[0].guid + ' for more details. To reprocess the video please rename file.',
                Subject: process.env.AWS_LAMBDA_FUNCTION_NAME +' failed for: '+ event.Records[0].s3.object.key,
                TargetArn: process.env.StepsErrors
            };

            sns.publish(sns_params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err, 'Failed');
                } else {
                    console.log('Source File has already been processed');
                    callback(null, 'Success');
                }
            });
        } else {
            console.log('New source video');
            var guid = uuid.v4();

            var json = {
                "guid": guid,
                "srcVideo": event.Records[0].s3.object.key,
                "srcSize": event.Records[0].s3.object.size,
                "srcBucket": event.Records[0].s3.bucket.name
            };

            console.log(json);

            var step_params = {
                stateMachineArn: process.env.IngestStepFunctions,
                input: JSON.stringify(json),
                name: guid
            };

            stepfunctions.startExecution(step_params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err, null);
                } else {
                    console.log(data);
                    callback(null, 'success');
                }
            });
        }
    });
};
