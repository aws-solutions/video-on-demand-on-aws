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
    var preset;

    // Define Presets
    switch (profile) {
        case '1080':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_1080p;

            break;
        case '720':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_720p;

            break;
        case '540':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_540p;
            break;
        case '432':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_432p;
            break;

        case '360':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_360p;
            break;

        case '270':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_270p;
            break;

        case '234':
            console.log('Using profile ' + profile);
            preset = process.env.Mp4_234p;
            break;

        default:
            console.log(profile + 'Error profile note set');
    }

    // Check source key
    if (key.indexOf('/') > -1) {
        outkey = key.split("/")[1].split('.')[0]; //remove folder and file extension
    } else {
        outkey = key.split('.')[0];
    }

    var ets_job = {
        PipelineId: process.env.EtsMp4,
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
            Key: outkey + '-' + profile + 'p.mp4',
            PresetId: preset,
        }]
    };

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
            UpdateExpression: 'SET mp4EncodeId = :id'
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
