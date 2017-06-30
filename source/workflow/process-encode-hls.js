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
const fs = require('fs');
const AWS = require('aws-sdk');
const elastictranscoder = new AWS.ElasticTranscoder({
    region: process.env.AWS_REGION
});
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Define inputs/Outputs
  let key = event.srcVideo;
  let outkey;
  let profile = event.profile;

  if (key.indexOf('/') > -1) {
      outkey = key.split("/")[1].split('.')[0]; //remove folder and file extension
  } else {
      outkey = key.split('.')[0];
  }
  outkey = outkey.replace(/\s/g, '-');

  let out1080p = {
      "Key": outkey + '-hls-1080p',
      "PresetId": process.env.Hls_1080p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out720p = {
      "Key": outkey + '-hls-720p',
      "PresetId": process.env.Hls_720p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out540p = {
      "Key": outkey + '-hls-540p',
      "PresetId": process.env.Hls_540p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out432p = {
      "Key": outkey + '-hls-432p',
      "PresetId": process.env.Hls_432p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out360p = {
      "Key": outkey + '-hls-360p',
      "PresetId": process.env.Hls_360p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out270p = {
      "Key": outkey + '-hls-270p',
      "PresetId": process.env.Hls_270p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };
  let out234p = {
      "Key": outkey + '-hls-234p',
      "PresetId": process.env.Hls_234p,
      "SegmentDuration": "5.0",
      "Watermarks": [
         {
            "InputKey": 'watermarks/' + process.env.WatermarkFile,
            'PresetWatermarkId':"VOD"
         }
      ]
  };

  let params = {
      "PipelineId": process.env.EtsHls,
      "OutputKeyPrefix": event.guid + "/",
      "Input": {
          "Key":key,
          "FrameRate": "auto",
          "Resolution": "auto",
          "AspectRatio": "auto",
          "Interlaced": "auto",
          "Container": "auto"
      },
      "Outputs": [],
      "Playlists": [{
          "OutputKeys": [],
          "Name": outkey,
          "Format": "HLSv3"
      }]
  };

  switch (profile) {
      case '1080':
          params.Outputs.push(out1080p, out720p, out540p, out432p, out360p, out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-1080p', outkey + '-hls-720p', outkey + '-hls-540p', outkey + '-hls-432p', outkey + '-hls-360p', outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '720':
          params.Outputs.push(out720p, out540p, out432p, out360p, out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-720p', outkey + '-hls-540p', outkey + '-hls-432p', outkey + '-hls-360p', outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '540':
          params.Outputs.push(out540p, out432p, out360p, out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-540p', outkey + '-hls-432p', outkey + '-hls-360p', outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '432':
          params.Outputs.push(out432p, out360p, out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-432p', outkey + '-hls-360p', outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '360':
          params.Outputs.push(out360p, out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-360p', outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '270':
          params.Outputs.push(out270p, out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-270p', outkey + '-hls-234p');
          break;

      case '234':
          params.Outputs.push(out234p);
          params.Playlists[0].OutputKeys.push(outkey + '-hls-234p');
          break;

      default:
          console.log('Error' + profile + ' not set');
  }

  console.log('Generating parameters for proflie:' + profile);

  // Watermark options
  if (process.env.Watermark === 'No') {
    console.log('Removing watermark options from parameters.');
    for (var outputs in params.Outputs) {
      delete params.Outputs[outputs].Watermarks;
    }
  }

  console.log(JSON.stringify(params, null,2));

  let ets = elastictranscoder.createJob(params).promise();

  ets.then(function(data) {
    params = {TableName: process.env.DynamoDB,
      Key: {'guid': {'S': event.guid}},
      ExpressionAttributeValues: {':id': {S: data.Job.Id},':status': {S: "Encoding"}},
      UpdateExpression: 'SET hlsEncodeId = :id,' + 'workflowStatus = :status'
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
