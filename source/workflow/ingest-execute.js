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
'use strict';
const AWS = require('aws-sdk');
const uuid = require('uuid');
const stepfunctions = new AWS.StepFunctions({region: process.env.AWS_REGION});
const docClient = new AWS.DynamoDB.DocumentClient({region: process.env.AWS_REGION});
const sns = new AWS.SNS({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  //check source key for spaces
  let key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  let params = {
        TableName: process.env.DynamoDB,
        FilterExpression: 'srcVideo = :src',
        ExpressionAttributeValues: {':src': key}
      };

  let scanData = docClient.scan(params).promise();

  scanData.then(function(data) {
    if (data.Items[0]) {

      params = {
        Message: 'The source video ' + event.Records[0].s3.object.key + ' has already been processed, see GUID: ' + data.Items[0].guid + ' for more details. To reprocess the video please rename file.',
        Subject: process.env.AWS_LAMBDA_FUNCTION_NAME +' failed for: '+ key,
        TargetArn: process.env.StepsPublish
      };

      sns.publish(params, function(err) {
        if (err) throw(err);
        else console.log('Source File has already been processed, SNS sent');
      });
    } else {
      let guid = uuid.v4();

      let json = {
          "guid": guid,
          "srcVideo": key,
          "srcSize": event.Records[0].s3.object.size,
          "srcBucket": event.Records[0].s3.bucket.name
      };
      params = {
          stateMachineArn: process.env.IngestWorkflow,
          input: JSON.stringify(json),
          name: guid
      };
      stepfunctions.startExecution(params, function(err, data) {
        if (err) throw(err);
        console.log('Ingest Workflow execute:', JSON.stringify(event, null, 2));
      });
    }

    callback(null, 'Success');

    }).catch(function(err) {
      console.log(err, err.stack);
      callback(err);
    });
};
