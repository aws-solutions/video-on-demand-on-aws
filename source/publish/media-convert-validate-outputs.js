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
const moment = require('moment');

exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const s3 = new AWS.S3();

  function validate(bucket, key) {
    let response = new Promise((res, reject) => {
      let params = {
        Bucket: bucket,
        Key: key
      };
      console.log(params);
      s3.headObject(params, function(err, data) {
        if (err) reject(err);
        else {
          res(data);
        }
      });
    });
    return response;
  }

  // create output and validate lists output file
  // output filenames are 'source filename'+'preset'
  let promises = [];
  let mp4Base = event.guid + '/mp4/' + event.srcVideo.split(".").slice(0, -1).join(".");
  let hlsBase = event.guid + '/hls/' + event.srcVideo.split(".").slice(0, -1).join(".");
  let dashBase = event.guid + '/dash/' + event.srcVideo.split(".").slice(0, -1).join(".");
  let key;

  if (event.hls) {
    event.hlsPlaylist = hlsBase + '.m3u8';
    event.hlsUrl = 'https://'+  process.env.CloudFront + '/' + hlsBase + '.m3u8';
    console.log(event.hlsPlaylist);
    promises.push(validate(event.abrBucket, event.hlsPlaylist));
  }

  if (event.dash) {
    event.dashPlaylist = dashBase + '.mpd';
    event.dashUrl = 'https://'+ process.env.CloudFront + '/' + dashBase + '.mpd';
    console.log(event.dashPlaylist);
    promises.push(validate(event.abrBucket, event.dashPlaylist));
  }

  if (event.mp4) {
    event.mp4Outputs = [];
    for (let i = event.mp4.length - 1; i >= 0; i--) {
      key = mp4Base + '_' + event.mp4[i] + 'p.mp4';
      event.mp4Outputs.push(key);
      promises.push(validate(event.mp4Bucket, key));
    }
  }

  Promise.all(promises)
    .then(() => {
      event.workflowStatus = 'complete';
      event.EndTime = moment().utc().format('YYYY-MM-DD HH:mm.S');
      callback(null, event);
    })
    .catch(err => {
      error.handler(event, err);
      callback(err);
    });
};
