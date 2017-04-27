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

/*
Step function: creates a ETs job & updates Dynamo with the joj ID
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

    var key = event.srcVideo;
    var outkey;
    var profile = event.profile;
    var ets_job;

    // Check source key
    if (key.indexOf('/') > -1) {
        outkey = key.split("/")[1].split('.')[0]; //remove folder and file extension
    } else {
        outkey = key.split('.')[0];
    }

    switch (profile) {
        case '1080':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-1080p',
                        PresetId: process.env.Hls_1080p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-720p',
                        PresetId: process.env.Hls_720p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-540p',
                        PresetId: process.env.Hls_540p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-432p',
                        PresetId: process.env.Hls_432p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-360p',
                        PresetId: process.env.Hls_360p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-1080p',
                        outkey + '-hls-720p',
                        outkey + '-hls-540p',
                        outkey + '-hls-432p',
                        outkey + '-hls-360p',
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '720':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-720p',
                        PresetId: process.env.Hls_720p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-540p',
                        PresetId: process.env.Hls_540p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-432p',
                        PresetId: process.env.Hls_432p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-360p',
                        PresetId: process.env.Hls_360p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-720p',
                        outkey + '-hls-540p',
                        outkey + '-hls-432p',
                        outkey + '-hls-360p',
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '540':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-540p',
                        PresetId: process.env.Hls_540p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-432p',
                        PresetId: process.env.Hls_432p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-360p',
                        PresetId: process.env.Hls_360p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-540p',
                        outkey + '-hls-432p',
                        outkey + '-hls-360p',
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '432':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-432p',
                        PresetId: process.env.Hls_432p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-360p',
                        PresetId: process.env.Hls_360p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-432p',
                        outkey + '-hls-360p',
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '360':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-360p',
                        PresetId: process.env.Hls_360p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-360p',
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '270':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                        Key: outkey + '-hls-270p',
                        PresetId: process.env.Hls_270p,
                        SegmentDuration: '5.0'
                    },
                    {
                        Key: outkey + '-hls-234p',
                        PresetId: process.env.Hls_234p,
                        SegmentDuration: '5.0'
                    }
                ],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-270p',
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        case '234':
            console.log('Using profile ' + profile);
            ets_job = {
                PipelineId: process.env.EtsHls,
                OutputKeyPrefix: event.guid + '/',
                Input: {
                    Key: key,
                    FrameRate: 'auto',
                    Resolution: 'auto',
                    AspectRatio: 'auto',
                    Interlaced: 'auto',
                    Container: 'auto'
                },
                Outputs: [{
                    Key: outkey + '-hls-234p',
                    PresetId: process.env.Hls_234p,
                    SegmentDuration: '5.0'
                }],
                Playlists: [{
                    OutputKeys: [
                        outkey + '-hls-234p'
                    ],
                    Name: outkey,
                    Format: "HLSv3"
                }]
            };
            break;

        default:
            console.log('Error' + profile + 'does not match any preset');
    }

    elastictranscoder.createJob(ets_job, function(err, data) {

        var db_update = {
            TableName: process.env.Dynamo,
            Key: {
                'guid': {
                    'S': event.guid
                }
            },
            ExpressionAttributeValues: {
                ':id': {
                    S: data.Job.Id
                }
            },
            UpdateExpression: 'SET hlsEncodeId = :id'
        };

        dynamodb.updateItem(db_update, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                callback(err, 'Failed');
            } else {
                console.log(data);
                callback(null, 'Success');
            }
        });
    });
};
