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
const error = require('./lib/error.js');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  let msg = {};
  let subject;

  if (event.workflowStatus === 'ingest') {
    msg = {
      "StartTime": event.startTime,
      "Source Video": event.srcVideo
    };
    subject = 'Workflow started guid:' + event.guid;
  }

  if (event.workflowStatus === 'complete') {
    msg.guid = event.guid;
    msg.srcVideo = event.srcVideo;
    if (event.hlsUrl) msg.hlsUrl = event.hlsUrl;
    if (event.dashUrl)  msg.dashUrl = event.dashUrl;
    if (event.mp4Outputs) msg.mp4Outputs = event.mp4Outputs;
    subject = 'Workflow complete guid:' + event.guid;
  }

  console.log('Sending Notification: ',JSON.stringify(msg, null, 2))

  let params = {
    Message: JSON.stringify(msg, null, 2),
    Subject: subject,
    TargetArn: process.env.NotificationSns
  };

  sns.publish(params).promise()
    .then(() => {
      callback(null, event);
    })
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
