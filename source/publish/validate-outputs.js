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

  const s3 = new AWS.S3();

  let bucket;

  if (event.preset === 'mp4') {
    bucket = process.env.Mp4Dest;
  } else {
     bucket = process.env.AbrDest;
  }

  function validate(output) {
    let response = new Promise((res, reject) => {
      let params = {
        Bucket: bucket,
        Key: output
      };
      s3.headObject(params, function(err, data) {
        if (err) reject('error: ',output,' not found');
        else {
          res(data);
        }
      });
    });
    return response;
  }

  let promises = [];
  let outputs = [];

  for (let i = event.msg.outputs.length - 1; i >= 0; i--) {
    let output = event.msg.outputKeyPrefix + event.msg.outputs[i].key;
    if (event.preset === 'hls') {
      output = output + '.m3u8';
    }
    outputs.push(output);
    promises.push(validate(output));
  }

  Promise.all(promises)
    .then(() => {
      event[event.preset + 'Outputs'] = outputs;
      let cfn = 'https://' + process.env.CloudFront + '/' + event.guid + '/' + event.preset + "/";

      if (event.preset === 'hls') {
        event[event.preset + 'Playlist'] = cfn + event.msg.playlists[0].name + '.m3u8';
      }

      if (event.preset === 'dash') {
        event[event.preset + 'Playlist'] = cfn + event.msg.playlists[0].name + '.mpd';
      }

      if (event.msg.outputs[0].thumbnailPattern) {
        if (event.msg.playlists) {
          event[event.preset + 'Thumbnails'] = cfn + "thumbnails/";
        } else {
          event[event.preset + 'Thumbnails'] = event.guid + '/' + event.preset + "/thumbnails/";
        }
      }

      event[event.preset + 'EtsMsg'] = event.msg;
      delete event.msg;
      console.log('content validated:', JSON.stringify(outputs,null,2));
      callback(null, event);
    })
    .catch(err => {
      error.sns(event, err);
      callback(err);
    });
};
