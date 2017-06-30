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
**/
'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const MediaInfo = require('./lib/mediaInfoCommand').MediaInfoCommand;
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  let params;
  let info;

  if (event.preset) {
      params = {
          Bucket: process.env.Mp4Dest,
          Key: event.output,
          Expires: 300
      };
      info = 'mp4Mediainfo';
  } else {
      params = {
          Bucket: event.srcBucket,
          Key: event.srcVideo,
          Expires: 300
      };
      info = 'srcMediainfo';
  }

  console.log('running ' + info, JSON.stringify(params));

  let url = s3.getSignedUrl('getObject', params);
  let mediaInfo = new MediaInfo(url);

  mediaInfo.on('error', (err) => {
    console.log(err, err.stack);
    callback(err);
  });

  mediaInfo.once('$runCompleted', (output) => {

    console.log(JSON.stringify(output, null, 2))

    params = {
      TableName: process.env.DynamoDB,
      Key: {"guid": {S: event.guid}},
      ExpressionAttributeValues: {':json': {S: JSON.stringify(output)}},
      UpdateExpression: 'SET ' + info + ' = :json'
    };

    dynamodb.updateItem(params, function(err) {
      if (err) {
        console.log(err, err.stack);
        callback(err);
      }
      else {
        console.log('DynamoDB updated with Mediainfo');
        callback(null, 'Sucess');
      }
    });
  });
  mediaInfo.run();
};
