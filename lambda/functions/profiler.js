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
Step function: Get mediainfo for source video from dynamo, check
the video width to determine SD/HD and add profile to step function
input json.
*/
'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: process.env.AWS_REGION
});

exports.handler = (event, context, callback) => {
    var get_params = {
        TableName: process.env.Dynamo,
        Key: {
            "guid": {
                S: event.guid
            }
        }
    };

    var setProfile = new Promise(
        function(res, reject) {
            dynamodb.getItem(get_params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject(Error("Failed"));
                } else {
                    var profile;
                    var mediainfo = JSON.parse(data.Item.srcMediainfo.S);
                    var height = mediainfo.$videoES[0].height;

                    if (height >= 1080) {
                        profile = '1080';
                        console.log('Video height: ' + height + 'p setting profile to 1080p');
                    } else if (height >= 720) {
                        profile = '720';
                        console.log('Video height: ' + height + 'p setting profile to 720p');
                    } else if (height >= 540) {
                        profile = '540';
                        console.log('Video height: ' + height + 'p setting profile to 480p');
                    } else if (height >= 432) {
                        profile = '432';
                        console.log('Video height: ' + height + 'p setting profile to 480p');
                    } else if (height >= 360) {
                        profile = '360';
                        console.log('Video height: ' + height + 'p setting profile to 480p');
                    } else if (height >= 270) {
                        profile = '270';
                        console.log('Video height: ' + height + 'p setting profile to 480p');
                    } else {
                        profile = '234';
                        console.log('Video height: ' + height + 'p setting profile to 360p');
                    }
                    res(profile);
                }
            });
        }
    );

    setProfile.then(
        function(res) {

            var params = {
                TableName: process.env.Dynamo,
                Key: {
                    'guid': {
                        'S': event.guid
                    }
                },
                ExpressionAttributeValues: {
                    ':pf': {
                        S: res
                    }
                },
                UpdateExpression: 'SET profile = :pf'
            };

            dynamodb.updateItem(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    callback(err, 'Failed');
                } else {
                    var json = {
                        "guid": event.guid,
                        "srcBucket": event.srcBucket,
                        "srcVideo": event.srcVideo,
                        "profile": res
                    };
                    console.log(json);
                    callback(null, json);
                }
            });
        }
    );
};
