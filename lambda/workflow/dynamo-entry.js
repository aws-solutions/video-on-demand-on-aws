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
Step function: creates the initial dynamo entry for the the srource video.
*/
'use strict';
const moment = require('moment');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});
const sns = new AWS.SNS({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
  var params = {
      Item: {
          "guid": {
              S: event.guid
          },
          "startTime": {
              S: moment().utc().format('YYYY-MM-DD HH:mm:ss.S')
          },
          "srcVideo": {
              S: event.srcVideo
          },
          "srcSize": {
              S: event.srcSize.toString()
          },
          "srcBucket": {
              S: event.srcBucket
          },
          "mp4Bucket": {
              S: process.env.Mp4Dest
          },
          "hlsBucket": {
              S: process.env.HlsDest
          },
          "workflowStatus": {
              S: 'Ingest'
          }
      },
      TableName: process.env.Dynamo
  };
  console.log(params);

  dynamodb.putItem(params, function(err, data) {
      if (err) {
          console.log(err, err.stack);
          callback(err, 'Failed');
      } else {
          console.log(data);
          callback(null, 'Success');
      }
  });
};
