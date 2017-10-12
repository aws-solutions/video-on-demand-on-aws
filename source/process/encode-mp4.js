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
  if (!event.mp4 || event.mp4.length < 1) {
    console.log('No MP4 outputs defined');
    event.mp4EtsJobId = null;
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
    let out1080p = {
      Key: outkey + '-mp4-1080p.mp4',
      PresetId: process.env.Mp4_1080p
    };
    let out720p = {
      Key: outkey + '-mp4-720p.mp4',
      PresetId: process.env.Mp4_720p
    };
    let out540p = {
      Key: outkey + '-mp4-540p.mp4',
      PresetId: process.env.Mp4_540p
    };
    let out432p = {
      Key: outkey + '-mp4-432p.mp4',
      PresetId: process.env.Mp4_432p
    };
    let out360p = {
      Key: outkey + '-mp4-360p.mp4',
      PresetId: process.env.Mp4_360p
    };
    let out270p = {
      Key: outkey + '-mp4-270p.mp4',
      PresetId: process.env.Mp4_270p,
    };
    let out234p = {
      Key: outkey + '-mp4-234p.mp4',
      PresetId: process.env.Mp4_234p
    };

    let params = {
      PipelineId: process.env.Mp4Pipeline,
      OutputKeyPrefix: event.guid + "/mp4/",
      Input: {
        Key: key,
        FrameRate: "auto",
        Resolution: "auto",
        AspectRatio: "auto",
        Interlaced: "auto",
        Container: "auto"
      },
      Outputs: [],
      UserMetadata: {
        guid: event.guid,
        preset: "mp4"
      }
    };

    console.log('Using Metadata Presets');

    for (let i = event.mp4.length - 1; i >= 0; i--) {
      switch (event.mp4[i]) {

        case 1080:
          {
            params.Outputs.push(out1080p);
            break;
          }
        case 720:
          {
            params.Outputs.push(out720p);
            break;
          }
        case 540:
          {
            params.Outputs.push(out540p);
            break;
          }
        case 432:
          {
            params.Outputs.push(out432p);
            break;
          }
        case 360:
          {
            params.Outputs.push(out360p);
            break;
          }
        case 270:
          {
            params.Outputs.push(out270p);
            break;
          }
        case 234:
          {
            params.Outputs.push(out234p);
            break;
          }
        default: {
          console.log('error: ', event.mp4[i], ' is not a valid preset.');
      }
    }
  }

  if (event.watermark) {
    let wm = [{
      InputKey: 'watermarks/' + event.watermark,
      PresetWatermarkId: "VOD"
    }];

  for (let i = params.Outputs.length - 1; i >= 0; i--) {
    params.Outputs[i].Watermarks = wm;
  }
}

if (event.thumbnails) {
  params.Outputs[0].ThumbnailPattern = 'thumbnails/' + outkey + '-{count}';
}

const elastictranscoder = new AWS.ElasticTranscoder({
  region: process.env.AWS_REGION
});

console.log('Creating ETS job: ', JSON.stringify(params, null, 2));

elastictranscoder.createJob(params).promise()
  .then(data => {
    event.mp4EtsJobId = data.Job.Id;
    event.workflowStatus = "encoding";
    callback(null, event);
  })
  .catch(err => {
    error.sns(event, err);
    callback(err);
  });
}
};
