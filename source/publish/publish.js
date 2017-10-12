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
const MetricsHelper = require('./lib/metrics-helper.js');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const sns = new AWS.SNS({
    region: process.env.AWS_REGION
  });

  if (process.env.SendAnonymousData === 'Yes') {
    let metricsHelper = new MetricsHelper();
    let data = event.srcMediainfo;
    data = JSON.parse(data)
    delete data.$fileName;
    delete data.$rawData;
    delete data.$xmlParserInstance;
    data.version = 2;
    if (event.hls) msg.hls = event.hls;
    if (event.mp4) msg.mp4 = event.mp4;
    if (event.dash) msg.dash = event.dash;
    if (event.upscaling) data.upscaling = event.upscaling;
    if (event.watermark) data.watermark = event.watermark;
    if (event.srcMetadataFile) data.srcMetadataFile = event.srcMetadataFile;

    let metric = {
      Solution: 'SO0021',
      UUID: process.env.UUID,
      TimeStamp: event.time,
      Data: data
    };
    metricsHelper.sendAnonymousMetric(metric, function(err) {
      if (err) throw (err);
      else console.log('anonymous data sent');
    });
  }

  let msg = {};
  msg.guid = event.guid;
  msg.srcVideo = event.srcVideo;
  if (event.hlsPlaylist) msg.hlsPlaylist = event.hlsPlaylist;
  if (event.mp4Outputs) msg.mp4Outputs = event.mp4Outputs;
  if (event.dashPlaylist) msg.dashPlaylist = event.dashPlaylist;

  let params = {
    Message: JSON.stringify(msg, null, 2),
    Subject: 'Workflow complete guid:' + event.guid,
    TargetArn: process.env.NotificationSns
  };

  sns.publish(params).promise()
    .then(() => {
      let status = {
        guid: event.guid,
        workflowStatus: event.workflowStatus,
        workflowEndTime: event.workflowEndTime
      };
      callback(null, status);
    })
    .catch(err => {
      error.sns(event, err);
      callback(err);
    });
};
