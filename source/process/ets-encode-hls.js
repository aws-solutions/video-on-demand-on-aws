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

  // check for presets or if array is empty
  if (!event.hls || event.hls.length < 1) {
    console.log('No Hls outputs defined');
    event.hlsEncodeId = null;
    callback(null, event);
  } else {
    // Define inputs/Outputs
    let key = event.srcVideo;
    let outkey;
    if (key.indexOf('/') > -1) {
      // remove folder and file extension
      outkey = key.split("/")[1].split('.')[0];
    } else {
      outkey = key.split('.')[0];
    }
    outkey = outkey.replace(/\s/g, '-');

    // define presets
    let out2160p = {
      Key: outkey + '-hls-2160p',
      PresetId: process.env.Hls_2160p,
      SegmentDuration: "2.0",
    };
    let out1080p = {
      Key: outkey + '-hls-1080p',
      PresetId: process.env.Hls_1080p,
      SegmentDuration: "2.0",
    };
    let out720p = {
      Key: outkey + '-hls-720p',
      PresetId: process.env.Hls_720p,
      SegmentDuration: "2.0"
    };
    let out540p = {
      Key: outkey + '-hls-540p',
      PresetId: process.env.Hls_540p,
      SegmentDuration: "2.0"
    };
    let out360p = {
      Key: outkey + '-hls-360p',
      PresetId: process.env.Hls_360p,
      SegmentDuration: "2.0"
    };
    let out270p = {
      Key: outkey + '-hls-270p',
      PresetId: process.env.Hls_270p,
      SegmentDuration: "2.0"
    };

    let params = {
      PipelineId: process.env.AbrPipeline,
      OutputKeyPrefix: event.guid + "/hls/",
      Input: {
        Key: key,
        FrameRate: "auto",
        Resolution: "auto",
        AspectRatio: "auto",
        Interlaced: "auto",
        Container: "auto"
      },
      Outputs: [],
      Playlists: [{
        OutputKeys: [],
        Name: outkey,
        Format: "HLSv3"
      }],
      UserMetadata: {
        guid: event.guid,
        preset: "hls"
      }
    };

    console.log('Using Metadata Presets');
    for (let i = event.hls.length - 1; i >= 0; i--) {
      switch (event.hls[i]) {

        case 2160: {
          params.Outputs.push(out2160p);
          params.Playlists[0].OutputKeys.push(out2160p.Key);
          break;
        }
        case 1080: {
          params.Outputs.push(out1080p);
          params.Playlists[0].OutputKeys.push(out1080p.Key);
          break;
        }
        case 720: {
          params.Outputs.push(out720p);
          params.Playlists[0].OutputKeys.push(out720p.Key);
          break;
        }
        case 540: {
          params.Outputs.push(out540p);
          params.Playlists[0].OutputKeys.push(out540p.Key);
          break;
        }
        case 360: {
          params.Outputs.push(out360p);
          params.Playlists[0].OutputKeys.push(out360p.Key);
          break;
        }
        case 270: {
          params.Outputs.push(out270p);
          params.Playlists[0].OutputKeys.push(out270p.Key);
          break;
        }
        default: {
          console.log('error: ', event.dash[i], ' is not a valid preset.');
        }
      }
    }

    if (event.imageOverlay) {
        let wm = [{
          InputKey: 'image-overlay/' + event.imageOverlay,
          PresetWatermarkId: "VOD"
        }];
        for (let i = params.Outputs.length - 1; i >= 0; i--) {
            params.Outputs[i].Watermarks = wm;
        }
    }

    if (event.frameCapture) {
      params.Outputs[0].ThumbnailPattern = 'frames/' + outkey + '-{count}';
    }

    const elastictranscoder = new AWS.ElasticTranscoder({
      region: process.env.AWS_REGION
    });

    console.log('Creating ETS job: ', JSON.stringify(params, null, 2));

    elastictranscoder.createJob(params).promise()
      .then(data => {
        event.hlsEtsJobId = data.Job.Id;
        event.workflowStatus = "encoding";
        callback(null, event);
      })
      .catch(err => {
        error.handler(event, err);
        callback(err);
      });
  }
};
