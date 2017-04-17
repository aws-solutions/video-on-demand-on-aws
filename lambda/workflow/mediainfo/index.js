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
Step function: check if input is the soruce or mp4 video, run mediainfo
& updates Dynamo with the joj ID
*/
'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const MediaInfo = require('./lib/mediaInfoCommand').MediaInfoCommand;
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {

    let s3_get;
    let info;

    if (event.preset) {
        s3_get = {
            Bucket: process.env.Mp4Dest,
            Key: event.guid + '/' + event.mp4Output,
            Expires: 300
        };
        info = 'mp4Mediainfo';
    } else {
        s3_get = {
            Bucket: event.srcBucket,
            Key: event.srcVideo,
            Expires: 300
        };
        info = 'srcMediainfo';
    }

    var url = s3.getSignedUrl('getObject', s3_get);
    var mediaInfo = new MediaInfo(url);

    var media = new Promise(function(res, reject) {
        mediaInfo.on('error', (err) => {
            console.log(`mediaInfo.error: ${err}`);
            reject('failed');
        });

        mediaInfo.once('$runCompleted', (output) => {
            res(output);
        });
        mediaInfo.run();
    });

    media.then(function(res) {
        console.log(res)
        var db_put = {
            TableName: process.env.Dynamo,
            Key: {
                'guid': {
                    'S': event.guid
                }
            },
            ExpressionAttributeValues: {
                ':json': {
                    S: JSON.stringify(res)
                }
            },
            UpdateExpression: 'SET ' + info + ' = :json'
        };

        // store mediainfo xml output in dynamo
        dynamodb.updateItem(db_put, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                callback(err, null);
            } else {
                callback(null, 'Sucess');
            }
        });
    });
};
