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
    let lastSlashIndex = key.lastIndexOf('/');
    if (lastSlashIndex > -1) {
      // remove folder and file extension
      outkey = key.slice(lastSlashIndex+1).split('.')[0];
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
        default: {
          console.log('error: ', event.mp4[i], ' is not a valid preset.');
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
    event.mp4EtsJobId = data.Job.Id;
    event.workflowStatus = "encoding";
    callback(null, event);
  })
  .catch(err => {
    error.handler(event, err);
    callback(err);
  });
}
};
