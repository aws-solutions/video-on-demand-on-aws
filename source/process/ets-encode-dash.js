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
    if (!event.dash || event.dash.length < 1) {
        console.log('No Dash outputs defined');
        event.dashEncodeId = null;
        callback(null, event);
    } else {
        // Define inputs/Outputs
        let key = event.srcVideo;
        let outkey;
        let lastSlashIndex = key.lastIndexOf('/');
        if (lastSlashIndex > -1) {
            //remove folder(s) and file extension
            outkey = key.slice(lastSlashIndex+1).split('.')[0];
        } else {
            outkey = key.split('.')[0];
        }
        outkey = outkey.replace(/\s/g, '-');

        // define presets
        let out1080p = {
            Key: outkey + '-dash-1080p.fmp4',
            PresetId: process.env.Dash_1080p,
            SegmentDuration: "5.0",
        };
        let out720p = {
            Key: outkey + '-dash-720p.fmp4',
            PresetId: process.env.Dash_720p,
            SegmentDuration: "5.0"
        };
        let out540p = {
            Key: outkey + '-dash-540p.fmp4',
            PresetId: process.env.Dash_540p,
            SegmentDuration: "5.0"
        };
        let out360p = {
            Key: outkey + '-dash-360p.fmp4',
            PresetId: process.env.Dash_360p,
            SegmentDuration: "5.0"
        };
        let out270p = {
            Key: outkey + '-dash-270p.fmp4',
            PresetId: process.env.Dash_270p,
            SegmentDuration: "5.0"
        };
        let audio = {
          Key: outkey + '-dash-128-audio.fmp4',
          PresetId: process.env.Dash_128_Audio,
          SegmentDuration: "5.0"
        };

        let params = {
            PipelineId: process.env.AbrPipeline,
            OutputKeyPrefix: event.guid + "/dash/",
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
                Format: "MPEG-DASH"
            }],
            UserMetadata: {
              guid:event.guid,
              preset:"dash"
            }
        };

        console.log('Using Metadata Presets');

        for (let i = event.dash.length - 1; i >= 0; i--) {

            switch (parseInt(event.dash[i],10)) {

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
          params.Outputs[0].ThumbnailPattern = 'frames/'+outkey+'-{count}';
        }

        params.Outputs.push(audio);
        params.Playlists[0].OutputKeys.push(audio.Key);

        const elastictranscoder = new AWS.ElasticTranscoder({
            region: process.env.AWS_REGION
        });

        console.log('Creating ETS job: ',JSON.stringify(params, null, 2));

        elastictranscoder.createJob(params).promise()
          .then(data => {
              event.dashEtsJobId = data.Job.Id;
              event.workflowStatus = "encoding";
              callback(null, event);
          })
          .catch(err => {
            error.handler(event, err);
            callback(err);
          });
    }
};
