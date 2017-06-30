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
const fs = require('fs');
const elastictranscoder = new AWS.ElasticTranscoder({region: process.env.AWS_REGION});
const dynamodb = new AWS.DynamoDB({region: process.env.AWS_REGION});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Define Preset to use
  let preset;
  switch (event.profile) {
      case '1080':
          preset = process.env.Mp4_1080p;

          break;
      case '720':
          preset = process.env.Mp4_720p;

          break;
      case '540':
          preset = process.env.Mp4_540p;
          break;
      case '432':
          preset = process.env.Mp4_432p;
          break;

      case '360':
          preset = process.env.Mp4_360p;
          break;

      case '270':
          preset = process.env.Mp4_270p;
          break;

      case '234':
          preset = process.env.Mp4_234p;
          break;

      default:
          console.log(event.profile + 'Error profile note set');
  }
  console.log('Using profile ' + event.profile);

  // Check source key
  let outkey;
  if (event.srcVideo.indexOf('/') > -1) {
      outkey = event.srcVideo.split("/")[1].split('.')[0]; //remove folder and file extension
  } else {
      outkey = event.srcVideo.split('.')[0];
  }

  outkey = outkey.replace(/\s/g, '-');

  let params = {
      "PipelineId": process.env.EtsMp4,
      "OutputKeyPrefix": event.guid + '/',
      "Input": {
          "Key": event.srcVideo,
          "FrameRate": "auto",
          "Resolution": "auto",
          "AspectRatio": "auto",
          'Interlaced': "auto",
          "Container": "auto"
      },
      "Outputs": [
        {
          "Key": outkey + '-' + event.profile + 'p.mp4',
          "PresetId": preset,
          "Watermarks": [
             {
                "InputKey": 'watermarks/' + process.env.WatermarkFile,
                'PresetWatermarkId':"VOD"
             }
          ]
        }
      ]
  };

  if (process.env.Watermark === 'No') {
    delete params.Outputs[0].Watermarks;
  }
  console.log(JSON.stringify(params, null,2));

  let ets = elastictranscoder.createJob(params).promise();

  ets.then(function(data) {
    params = {TableName: process.env.DynamoDB,
      Key: {'guid': {'S': event.guid}},
      ExpressionAttributeValues: {':id': {S: data.Job.Id},':status': {S: "Encoding"}},
      UpdateExpression: 'SET mp4EncodeId = :id,' + 'workflowStatus = :status'
    };
    dynamodb.updateItem(params, function(err, data) {
      if (err) throw(err);
      else console.log('DynamoDB updated with MP4 job ID');
    });

    callback(null, 'Success');

  }).catch(function(err) {
    console.log(err, err.stack);
    callback(err);
  });
};
